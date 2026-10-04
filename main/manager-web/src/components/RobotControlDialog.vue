<template>
  <el-dialog
    :visible.sync="visible"
    :title="$t('robot.title') || 'Contrôle Robot'"
    width="560px"
    custom-class="robot-control-dialog"
    :before-close="handleClose"
    :close-on-click-modal="false"
    append-to-body
  >
    <div class="robot-panel">
      <!-- Status Badge & Device Info -->
      <div class="robot-status-bar">
        <div class="status-indicator" :class="movementState">
          <span class="pulse-dot"></span>
          <span class="status-text">{{ statusText }}</span>
        </div>
        <div class="server-status">
          <el-tag size="mini" :type="serverConnected ? 'success' : 'danger'">
            <i class="el-icon-cpu"></i> {{ serverStatusText }}
          </el-tag>
        </div>
      </div>

      <!-- Dual Analog Joysticks -->
      <div class="joysticks-row">
        <!-- Left Joystick: Throttle + Steer -->
        <div class="joystick-wrapper">
          <span class="joystick-label">{{ $t('robot.drive') || 'Conduite' }}</span>
          <div class="joystick-zone" ref="leftZone"
            @mousedown="onJoyStart($event, 'left')"
            @touchstart.prevent="onJoyStart($event, 'left')">
            <div class="joystick-base">
              <div class="joystick-knob" :style="{ transform: `translate(${leftKnob.x}px, ${leftKnob.y}px)` }"></div>
              <i class="axis-arrow axis-up el-icon-top"></i>
              <i class="axis-arrow axis-down el-icon-bottom"></i>
              <i class="axis-arrow axis-left el-icon-back"></i>
              <i class="axis-arrow axis-right el-icon-right"></i>
            </div>
          </div>
          <div class="joystick-readout">
            <span>{{ $t('robot.speed') || 'Vitesse' }}: <b>{{ leftOutput.speed }}%</b></span>
            <span>Dir: <b>{{ leftOutput.steer > 0 ? '+' : '' }}{{ leftOutput.steer }}%</b></span>
          </div>
        </div>

        <!-- Center STOP -->
        <div class="center-stop-col">
          <button class="btn-stop-center" :class="{ active: activeKey === 'stop' }" @click="sendStop" title="STOP (Espace)">
            <i class="el-icon-video-pause"></i>
            <span>STOP</span>
          </button>
          <div class="speed-indicator">
            <div class="speed-bar" :style="{ height: Math.abs(leftOutput.speed) + '%' }"></div>
          </div>
        </div>

        <!-- Right Joystick: Speed trim -->
        <div class="joystick-wrapper">
          <span class="joystick-label">{{ $t('robot.maxSpeed') || 'Vitesse max' }}</span>
          <div class="joystick-zone" ref="rightZone"
            @mousedown="onJoyStart($event, 'right')"
            @touchstart.prevent="onJoyStart($event, 'right')">
            <div class="joystick-base">
              <div class="joystick-knob joystick-knob-right" :style="{ transform: `translate(${rightKnob.x}px, ${rightKnob.y}px)` }"></div>
              <i class="axis-arrow axis-up el-icon-top"></i>
              <i class="axis-arrow axis-down el-icon-bottom"></i>
            </div>
          </div>
          <div class="joystick-readout">
            <span>Max: <b>{{ speed }}%</b></span>
          </div>
        </div>
      </div>

      <!-- Keyboard Tip -->
      <div class="keyboard-tip">
        <i class="el-icon-info"></i>
        <span>{{ $t('robot.keyboardTip') || 'Clavier: Z/W/haut avant · S/bas arrière · Q/A/gauche · D/droite · Espace stop' }}</span>
      </div>

      <!-- Server config (collapsed) -->
      <div class="server-config-section">
        <el-collapse v-model="activeCollapse">
          <el-collapse-item name="serverConfig">
            <template slot="title">
              <span class="collapse-title"><i class="el-icon-setting"></i> Connexion serveur</span>
            </template>
            <div class="server-note">
              <i class="el-icon-info"></i>
              Laissez vide pour utiliser une URL relative (recommandé, évite les erreurs Mixed Content HTTPS).
            </div>
            <div class="server-input-row">
              <el-input size="small" v-model="serverUrl" placeholder="Vide = relatif (recommandé) ou https://host:port">
                <template slot="prepend">URL</template>
              </el-input>
              <el-button size="small" type="primary" plain @click="testConnection">Tester</el-button>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>
  </el-dialog>
</template>

<script>
const JOY_RADIUS = 52;
const JOY_DEAD = 0.12;

export default {
  name: 'RobotControlDialog',
  props: {
    visible: { type: Boolean, default: false },
    deviceId: { type: String, default: '' },
  },
  data() {
    return {
      speed: 80,
      movementState: 'stopped',
      activeKey: null,
      serverConnected: true,
      activeCollapse: [],
      serverUrl: '',
      leftKnob: { x: 0, y: 0 },
      leftOutput: { speed: 0, steer: 0 },
      leftDragging: false,
      leftOrigin: { x: 0, y: 0 },
      rightKnob: { x: 0, y: 0 },
      rightDragging: false,
      rightOrigin: { x: 0, y: 0 },
      joySendTimer: null,
      heldKeys: new Set(),
      keyTimer: null,
      _mMove: null, _mUp: null, _tMove: null, _tEnd: null,
    };
  },
  computed: {
    statusText() {
      const m = {
        forward: this.$t('robot.movingForward') || 'Avance',
        backward: this.$t('robot.movingBackward') || 'Recul',
        left: this.$t('robot.turningLeft') || 'Gauche',
        right: this.$t('robot.turningRight') || 'Droite',
      };
      return m[this.movementState] || this.$t('robot.stopped') || 'Arret';
    },
    serverStatusText() {
      return this.serverConnected ? 'ESP32 Pret' : 'Serveur indisponible';
    },
  },
  watch: {
    visible(val) {
      if (val) { this.bindKeyboard(); this.testConnection(); }
      else { this.unbindKeyboard(); this._stopAll(); }
    },
  },
  beforeDestroy() {
    this.unbindKeyboard();
    this._stopAll();
    this._unbindMove();
  },
  methods: {
    handleClose() { this.sendStop(); this.$emit('update:visible', false); },
    _stopAll() { this.stopJoystick('left'); this.stopJoystick('right'); this.stopKeyTimer(); },

    bindKeyboard() {
      window.addEventListener('keydown', this.handleKeyDown);
      window.addEventListener('keyup', this.handleKeyUp);
    },
    unbindKeyboard() {
      window.removeEventListener('keydown', this.handleKeyDown);
      window.removeEventListener('keyup', this.handleKeyUp);
    },
    handleKeyDown(e) {
      if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      const key = e.key.toLowerCase();
      const dirs = {
        arrowup: 'forward', w: 'forward', z: 'forward',
        arrowdown: 'backward', s: 'backward',
        arrowleft: 'left', a: 'left', q: 'left',
        arrowright: 'right', d: 'right',
      };
      if (key === ' ' || key === 'spacebar') { this.sendStop(); e.preventDefault(); return; }
      if (dirs[key]) { e.preventDefault(); this.heldKeys.add(dirs[key]); this.startKeyTimer(); }
    },
    handleKeyUp(e) {
      if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      const key = e.key.toLowerCase();
      const dirs = {
        arrowup: 'forward', w: 'forward', z: 'forward',
        arrowdown: 'backward', s: 'backward',
        arrowleft: 'left', a: 'left', q: 'left',
        arrowright: 'right', d: 'right',
      };
      if (dirs[key]) {
        this.heldKeys.delete(dirs[key]);
        if (!this.heldKeys.size) { this.stopKeyTimer(); this.sendStop(); }
      }
    },
    startKeyTimer() {
      if (this.keyTimer) return;
      const dispatch = () => {
        const dir = ['forward', 'backward', 'left', 'right'].find(d => this.heldKeys.has(d));
        if (dir) {
          this.movementState = dir; this.activeKey = dir;
          this._post('/xiaozhi/robot/move', { direction: dir, speed: this.speed, duration_ms: 0 });
        }
      };
      dispatch();
      this.keyTimer = setInterval(dispatch, 300);
    },
    stopKeyTimer() {
      if (this.keyTimer) { clearInterval(this.keyTimer); this.keyTimer = null; }
      this.movementState = 'stopped'; this.activeKey = null;
    },

    onJoyStart(e, side) {
      const isTouch = e.type === 'touchstart';
      const pt = isTouch ? e.touches[0] : e;
      const zone = this.$refs[side + 'Zone'];
      const rect = zone.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      if (side === 'left') { this.leftOrigin = { x: cx, y: cy }; this.leftDragging = true; }
      if (side === 'right') { this.rightOrigin = { x: cx, y: cy }; this.rightDragging = true; }
      this._bindMove(isTouch);
      this._joyMove(pt.clientX, pt.clientY, side);
      if (!this.joySendTimer) {
        this.joySendTimer = setInterval(() => this._joyDispatch(), 150);
      }
    },
    _bindMove(isTouch) {
      if (isTouch) {
        this._tMove = (ev) => {
          if (this.leftDragging && ev.touches[0]) this._joyMove(ev.touches[0].clientX, ev.touches[0].clientY, 'left');
          if (this.rightDragging && ev.touches[0]) this._joyMove(ev.touches[0].clientX, ev.touches[0].clientY, 'right');
        };
        this._tEnd = () => { this.stopJoystick('left'); this.stopJoystick('right'); };
        window.addEventListener('touchmove', this._tMove, { passive: false });
        window.addEventListener('touchend', this._tEnd);
      } else {
        this._mMove = (ev) => {
          if (this.leftDragging) this._joyMove(ev.clientX, ev.clientY, 'left');
          if (this.rightDragging) this._joyMove(ev.clientX, ev.clientY, 'right');
        };
        this._mUp = () => { this.stopJoystick('left'); this.stopJoystick('right'); };
        window.addEventListener('mousemove', this._mMove);
        window.addEventListener('mouseup', this._mUp);
      }
    },
    _unbindMove() {
      if (this._mMove) { window.removeEventListener('mousemove', this._mMove); this._mMove = null; }
      if (this._mUp) { window.removeEventListener('mouseup', this._mUp); this._mUp = null; }
      if (this._tMove) { window.removeEventListener('touchmove', this._tMove); this._tMove = null; }
      if (this._tEnd) { window.removeEventListener('touchend', this._tEnd); this._tEnd = null; }
    },
    _joyMove(clientX, clientY, side) {
      const o = side === 'left' ? this.leftOrigin : this.rightOrigin;
      let dx = clientX - o.x;
      let dy = clientY - o.y;
      const dist = Math.hypot(dx, dy);
      if (dist > JOY_RADIUS) { dx = dx / dist * JOY_RADIUS; dy = dy / dist * JOY_RADIUS; }
      if (side === 'left') {
        this.leftKnob = { x: dx, y: dy };
        const nx = dx / JOY_RADIUS;
        const ny = dy / JOY_RADIUS;
        this.leftOutput = {
          speed: Math.abs(ny) > JOY_DEAD ? Math.round(-ny * 100) : 0,
          steer: Math.abs(nx) > JOY_DEAD ? Math.round(nx * 100) : 0,
        };
      } else {
        this.rightKnob = { x: 0, y: dy };
        const ny = dy / JOY_RADIUS;
        this.speed = Math.min(100, Math.max(20, 80 + (Math.abs(ny) > JOY_DEAD ? Math.round(-ny * 40) : 0)));
      }
    },
    stopJoystick(side) {
      if (side === 'left') { this.leftDragging = false; this.leftKnob = { x: 0, y: 0 }; this.leftOutput = { speed: 0, steer: 0 }; }
      if (side === 'right') { this.rightDragging = false; this.rightKnob = { x: 0, y: 0 }; }
      if (!this.leftDragging && !this.rightDragging) {
        if (this.joySendTimer) { clearInterval(this.joySendTimer); this.joySendTimer = null; }
        this.sendStop();
        this._unbindMove();
      }
    },
    _joyDispatch() {
      const { speed: thr, steer } = this.leftOutput;
      if (!thr && !steer) { this.movementState = 'stopped'; this.activeKey = null; return; }
      const dir = Math.abs(thr) >= Math.abs(steer)
        ? (thr >= 0 ? 'forward' : 'backward')
        : (steer > 0 ? 'right' : 'left');
      this.movementState = dir; this.activeKey = dir;
      const eff = Math.round(Math.max(Math.abs(thr), Math.abs(steer)) * this.speed / 100);
      this._post('/xiaozhi/robot/move', { direction: dir, speed: Math.min(100, eff), duration_ms: 0 });
    },

    _buildUrl(path) {
      if (this.serverUrl && this.serverUrl.trim()) return this.serverUrl.replace(/\/$/, '') + path;
      return path;
    },
    async _post(path, payload) {
      if (this.deviceId) payload.device_id = this.deviceId;
      try {
        const res = await fetch(this._buildUrl(path), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        this.serverConnected = res.ok;
      } catch (_) { this.serverConnected = false; }
    },
    async sendMove(direction) {
      this.movementState = direction; this.activeKey = direction;
      await this._post('/xiaozhi/robot/move', { direction, speed: this.speed, duration_ms: 1500 });
    },
    async sendStop() {
      this.movementState = 'stopped'; this.activeKey = 'stop';
      setTimeout(() => { if (this.activeKey === 'stop') this.activeKey = null; }, 300);
      await this._post('/xiaozhi/robot/stop', {});
    },
    async testConnection() {
      try {
        const res = await fetch(this._buildUrl('/xiaozhi/robot/status'));
        this.serverConnected = res.ok;
      } catch (_) { this.serverConnected = false; }
    },
  },
};
</script>

<style scoped>
.robot-control-dialog >>> .el-dialog {
  border-radius: 16px;
  background: #1e1e2d;
  color: #fff;
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
  border: 1px solid rgba(255,255,255,0.1);
}
.robot-control-dialog >>> .el-dialog__title { color: #f1f5f9; font-weight: 600; font-size: 18px; }
.robot-panel { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 0 6px; }

/* Status */
.robot-status-bar { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background: rgba(255,255,255,0.05); border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); }
.status-indicator { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; color: #94a3b8; }
.pulse-dot { width: 10px; height: 10px; border-radius: 50%; background: #94a3b8; display: inline-block; }
.status-indicator.forward, .status-indicator.backward, .status-indicator.left, .status-indicator.right { color: #38bdf8; }
.status-indicator.forward .pulse-dot, .status-indicator.backward .pulse-dot, .status-indicator.left .pulse-dot, .status-indicator.right .pulse-dot { background: #38bdf8; box-shadow: 0 0 10px #38bdf8; animation: pulse 1s infinite alternate; }
@keyframes pulse { 0% { transform: scale(0.9); opacity: 0.7; } 100% { transform: scale(1.3); opacity: 1; } }

/* Joysticks */
.joysticks-row { display: flex; align-items: center; justify-content: center; gap: 20px; width: 100%; user-select: none; }
.joystick-wrapper { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.joystick-label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
.joystick-zone { width: 130px; height: 130px; display: flex; align-items: center; justify-content: center; cursor: grab; }
.joystick-zone:active { cursor: grabbing; }
.joystick-base { width: 120px; height: 120px; border-radius: 50%; background: radial-gradient(circle at 40% 35%, #2e3250, #1a1b2e); border: 2px solid rgba(56,189,248,0.25); box-shadow: inset 0 4px 12px rgba(0,0,0,0.4), 0 0 20px rgba(56,189,248,0.08); position: relative; display: flex; align-items: center; justify-content: center; }
.joystick-knob { width: 44px; height: 44px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #60c7f8, #1e7aad); box-shadow: 0 4px 14px rgba(56,189,248,0.5); position: absolute; pointer-events: none; }
.joystick-knob-right { background: radial-gradient(circle at 35% 30%, #a78bfa, #5b21b6); box-shadow: 0 4px 14px rgba(139,92,246,0.5); }
.axis-arrow { position: absolute; font-size: 13px; color: rgba(255,255,255,0.18); }
.axis-up { top: 4px; left: 50%; transform: translateX(-50%); }
.axis-down { bottom: 4px; left: 50%; transform: translateX(-50%); }
.axis-left { left: 4px; top: 50%; transform: translateY(-50%); }
.axis-right { right: 4px; top: 50%; transform: translateY(-50%); }
.joystick-readout { display: flex; gap: 10px; font-size: 11px; color: #64748b; }
.joystick-readout b { color: #38bdf8; }

/* Center STOP */
.center-stop-col { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.btn-stop-center { width: 72px; height: 72px; border-radius: 50%; border: 3px solid #ef4444; background: radial-gradient(circle, #dc2626, #991b1b); box-shadow: 0 0 18px rgba(239,68,68,0.45); color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; outline: none; transition: transform 0.12s, box-shadow 0.12s; gap: 2px; }
.btn-stop-center i { font-size: 22px; }
.btn-stop-center span { font-size: 9px; font-weight: 700; letter-spacing: 1px; }
.btn-stop-center:hover { transform: scale(1.07); box-shadow: 0 0 26px rgba(239,68,68,0.65); }
.btn-stop-center:active, .btn-stop-center.active { transform: scale(0.93); }
.speed-indicator { width: 8px; height: 60px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; display: flex; align-items: flex-end; }
.speed-bar { width: 100%; background: linear-gradient(to top, #38bdf8, #0ea5e9); border-radius: 4px; transition: height 0.1s; min-height: 2px; }

/* Keyboard tip */
.keyboard-tip { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #94a3b8; background: rgba(56,189,248,0.08); border: 1px dashed rgba(56,189,248,0.3); border-radius: 8px; padding: 8px 14px; width: 100%; box-sizing: border-box; }
.keyboard-tip i { color: #38bdf8; font-size: 14px; }

/* Server config */
.server-config-section { width: 100%; }
.server-config-section >>> .el-collapse, .server-config-section >>> .el-collapse-item__header, .server-config-section >>> .el-collapse-item__wrap { background: transparent; border: none; color: #94a3b8; }
.collapse-title { font-size: 12px; color: #64748b; }
.server-input-row { display: flex; gap: 10px; margin-top: 8px; }
.server-note { font-size: 12px; color: #64748b; background: rgba(56,189,248,0.06); border-radius: 6px; padding: 8px 10px; margin-bottom: 6px; display: flex; gap: 6px; align-items: flex-start; }
.server-note i { color: #38bdf8; margin-top: 1px; }
</style>
