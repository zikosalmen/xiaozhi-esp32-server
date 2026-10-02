<template>
  <div class="robot-widget-wrapper" v-if="isLoggedIn">
    <!-- Collapsed FAB -->
    <div v-if="!isExpanded" class="robot-floating-fab" @click="isExpanded = true" title="RC-Car Control">
      <span class="fab-icon">🚗</span>
      <span class="fab-text">{{ $t('header.robotControl') || 'Robot' }}</span>
      <span class="fab-pulse"></span>
    </div>

    <!-- Expanded Panel -->
    <div v-else class="robot-floating-panel">
      <!-- Header -->
      <div class="panel-header">
        <div class="panel-title">
          <span>🚗</span>
          <span>{{ $t('robot.title') || 'RC-Car Control' }}</span>
        </div>
        <div class="header-right">
          <!-- Battery indicator -->
          <div class="battery-pill" :class="batteryClass" :title="`Batterie: ${batteryLevel}%`">
            <span class="bat-icon">{{ batteryIcon }}</span>
            <span class="bat-val">{{ batteryLevel }}%</span>
          </div>
          <button class="minimize-btn" @click="isExpanded = false">
            <i class="el-icon-minus"></i>
          </button>
        </div>
      </div>

      <!-- Status row -->
      <div class="status-row">
        <div class="status-chip" :class="{ active: driveSpeed !== 0 }">
          <span class="chip-label">{{ $t('robot.forward') || 'Drive' }}</span>
          <span class="chip-val">{{ driveSpeed > 0 ? '+' : '' }}{{ driveSpeed }}%</span>
        </div>
        <div class="status-chip" :class="{ active: steerAngle !== 0 }">
          <span class="chip-label">{{ $t('robot.right') || 'Steer' }}</span>
          <span class="chip-val">{{ steerAngle > 0 ? '+' : '' }}{{ steerAngle }}%</span>
        </div>
        <button class="stop-pill" @click="sendStop">
          <i class="el-icon-video-pause"></i>
          STOP
        </button>
      </div>

      <!-- Dual Joystick Zone -->
      <div class="joystick-zone">
        <!-- Left: Drive joystick (Y axis only) -->
        <div class="joystick-wrapper">
          <div class="joystick-label">
            <i class="el-icon-top"></i>{{ $t('robot.forward') || 'Drive' }}<i class="el-icon-bottom"></i>
          </div>
          <canvas
            ref="driveCanvas"
            class="joystick-canvas"
            :width="joystickSize"
            :height="joystickSize"
            @mousedown="startDrag($event, 'drive')"
            @touchstart.prevent="startDrag($event, 'drive')"
          ></canvas>
        </div>

        <!-- Right: Steer joystick (X axis only) -->
        <div class="joystick-wrapper">
          <div class="joystick-label">
            <i class="el-icon-back"></i>{{ $t('robot.right') || 'Steer' }}<i class="el-icon-right"></i>
          </div>
          <canvas
            ref="steerCanvas"
            class="joystick-canvas"
            :width="joystickSize"
            :height="joystickSize"
            @mousedown="startDrag($event, 'steer')"
            @touchstart.prevent="startDrag($event, 'steer')"
          ></canvas>
        </div>
      </div>

      <!-- Speed max slider -->
      <div class="speed-row">
        <span class="ctrl-label"><i class="el-icon-odometer"></i> Max:</span>
        <el-slider v-model="maxSpeed" :min="20" :max="100" :step="5" class="mini-slider"></el-slider>
        <span class="speed-badge">{{ maxSpeed }}%</span>
      </div>

      <!-- Keyboard tip -->
      <div class="panel-footer-tip">
        <i class="el-icon-info"></i>
        W/S = Drive | A/D = Steer | Space = STOP
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RobotControlWidget',
  data() {
    return {
      isExpanded: false,
      maxSpeed: 80,
      driveSpeed: 0,   // -100..+100
      steerAngle: 0,   // -100..+100
      batteryLevel: 0,
      batteryCharging: false,
      joystickSize: 130,
      // Joystick state
      activeJoystick: null,      // 'drive' | 'steer' | null
      driveKnobY: 0,             // -1..+1
      steerKnobX: 0,             // -1..+1
      sendInterval: null,
      pollInterval: null,
      serverUrl: window.location.hostname
        ? `http://${window.location.hostname}:8003`
        : 'http://localhost:8003',
    };
  },
  computed: {
    isLoggedIn() {
      if (this.$route && ['/login', '/register', '/retrieve-password'].includes(this.$route.path)) return false;
      return Boolean(
        localStorage.getItem('token') || localStorage.getItem('userInfo') ||
        (this.$store && this.$store.state && this.$store.state.userInfo && this.$store.state.userInfo.username)
      );
    },
    batteryIcon() {
      if (this.batteryCharging) return '⚡';
      if (this.batteryLevel > 75) return '🔋';
      if (this.batteryLevel > 40) return '🔋';
      if (this.batteryLevel > 15) return '🪫';
      return '🪫';
    },
    batteryClass() {
      if (this.batteryLevel > 50) return 'bat-ok';
      if (this.batteryLevel > 20) return 'bat-low';
      return 'bat-crit';
    },
  },
  watch: {
    isExpanded(val) {
      if (val) {
        this.$nextTick(() => {
          this.drawJoystick('drive', 0, 0);
          this.drawJoystick('steer', 0, 0);
        });
        this.bindKeyboard();
        this.startSendLoop();
        this.startPollBattery();
      } else {
        this.unbindKeyboard();
        this.stopSendLoop();
        this.stopPollBattery();
        this.sendStop();
      }
    },
  },
  mounted() {
    if (this.$eventBus) {
      this.$eventBus.$on('openRobotController', () => { this.isExpanded = true; });
    }
    // Bind global pointer/touch release
    window.addEventListener('mouseup',   this.endDrag);
    window.addEventListener('touchend',  this.endDrag);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('touchmove', this.onTouchMove, { passive: false });
  },
  beforeDestroy() {
    this.unbindKeyboard();
    this.stopSendLoop();
    this.stopPollBattery();
    window.removeEventListener('mouseup',   this.endDrag);
    window.removeEventListener('touchend',  this.endDrag);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('touchmove', this.onTouchMove);
  },
  methods: {
    /* ===== Drawing ===== */
    drawJoystick(which, nx, ny) {
      const ref   = which === 'drive' ? this.$refs.driveCanvas : this.$refs.steerCanvas;
      if (!ref) return;
      const ctx   = ref.getContext('2d');
      const W     = this.joystickSize;
      const H     = this.joystickSize;
      const cx    = W / 2;
      const cy    = H / 2;
      const R     = W / 2 - 8;    // base radius
      const kr    = 20;            // knob radius

      ctx.clearRect(0, 0, W, H);

      // Base circle
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(56,189,248,0.25)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Cross guides
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke();

      // Knob position (constrained to circle)
      const kx = cx + nx * R;
      const ky = cy + ny * R;

      // Glow
      const grd = ctx.createRadialGradient(kx, ky, 0, kx, ky, kr);
      grd.addColorStop(0, 'rgba(56,189,248,0.9)');
      grd.addColorStop(1, 'rgba(2,132,199,0.3)');
      ctx.beginPath();
      ctx.arc(kx, ky, kr, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();
    },

    /* ===== Drag handling ===== */
    startDrag(e, which) {
      e.preventDefault();
      this.activeJoystick = which;
      this.handleMove(e, which);
    },
    endDrag() {
      if (!this.activeJoystick) return;
      // Return knob to center
      if (this.activeJoystick === 'drive') {
        this.driveKnobY  = 0;
        this.driveSpeed  = 0;
        this.drawJoystick('drive', 0, 0);
        this.sendDrive(0);
      } else {
        this.steerKnobX  = 0;
        this.steerAngle  = 0;
        this.drawJoystick('steer', 0, 0);
        this.sendSteer(0);
      }
      this.activeJoystick = null;
    },
    onMouseMove(e) {
      if (!this.activeJoystick) return;
      this.handleMove(e, this.activeJoystick);
    },
    onTouchMove(e) {
      if (!this.activeJoystick) return;
      e.preventDefault();
      this.handleMove(e, this.activeJoystick);
    },
    handleMove(e, which) {
      const ref = which === 'drive' ? this.$refs.driveCanvas : this.$refs.steerCanvas;
      if (!ref) return;
      const rect = ref.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const R  = rect.width / 2 - 8;

      let clientX, clientY;
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > R) { dx = (dx / dist) * R; dy = (dy / dist) * R; }

      const nx = dx / R;  // -1..+1
      const ny = dy / R;  // -1..+1  (positive = down = backward)

      if (which === 'drive') {
        this.driveKnobY = ny;
        this.driveSpeed = Math.round(-ny * this.maxSpeed);  // invert: up = forward
        this.drawJoystick('drive', 0, ny);   // drive: Y-axis only
      } else {
        this.steerKnobX = nx;
        this.steerAngle = Math.round(nx * this.maxSpeed);
        this.drawJoystick('steer', nx, 0);  // steer: X-axis only
      }
    },

    /* ===== Send loop ===== */
    startSendLoop() {
      this.sendInterval = setInterval(() => {
        if (this.driveSpeed !== 0) this.sendDrive(this.driveSpeed);
        if (this.steerAngle !== 0) this.sendSteer(this.steerAngle);
      }, 150);  // 150ms refresh while held
    },
    stopSendLoop() {
      if (this.sendInterval) { clearInterval(this.sendInterval); this.sendInterval = null; }
    },

    /* ===== Battery polling ===== */
    startPollBattery() {
      this.pollBattery();
      this.pollInterval = setInterval(() => this.pollBattery(), 15000);
    },
    stopPollBattery() {
      if (this.pollInterval) { clearInterval(this.pollInterval); this.pollInterval = null; }
    },
    async pollBattery() {
      try {
        const res = await fetch(`${this.serverUrl}/xiaozhi/robot/status`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.battery !== undefined) {
            this.batteryLevel    = data.battery.level    || 0;
            this.batteryCharging = data.battery.charging || false;
          }
        }
      } catch (_) { /* silent */ }
    },

    /* ===== API calls ===== */
    async sendDrive(speed) {
      try {
        await fetch(`${this.serverUrl}/xiaozhi/robot/drive`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ speed, duration_ms: 0 }),
        });
      } catch (_) { /* offline */ }
    },
    async sendSteer(angle) {
      try {
        await fetch(`${this.serverUrl}/xiaozhi/robot/steer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ angle, duration_ms: 0 }),
        });
      } catch (_) { /* offline */ }
    },
    async sendStop() {
      this.driveSpeed = 0;
      this.steerAngle = 0;
      this.driveKnobY = 0;
      this.steerKnobX = 0;
      if (this.isExpanded) {
        this.drawJoystick('drive', 0, 0);
        this.drawJoystick('steer', 0, 0);
      }
      try {
        await fetch(`${this.serverUrl}/xiaozhi/robot/stop`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
      } catch (_) { /* offline */ }
    },

    /* ===== Keyboard ===== */
    bindKeyboard() {
      window.addEventListener('keydown', this.onKeyDown);
      window.addEventListener('keyup',   this.onKeyUp);
    },
    unbindKeyboard() {
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('keyup',   this.onKeyUp);
    },
    onKeyDown(e) {
      if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      const k = e.key.toLowerCase();
      if (['w', 'arrowup'].includes(k)) {
        e.preventDefault();
        this.driveSpeed = this.maxSpeed;
        this.sendDrive(this.driveSpeed);
        if (this.isExpanded) this.drawJoystick('drive', 0, -1);
      } else if (['s', 'arrowdown'].includes(k)) {
        e.preventDefault();
        this.driveSpeed = -this.maxSpeed;
        this.sendDrive(this.driveSpeed);
        if (this.isExpanded) this.drawJoystick('drive', 0, 1);
      } else if (['a', 'q', 'arrowleft'].includes(k)) {
        e.preventDefault();
        this.steerAngle = -this.maxSpeed;
        this.sendSteer(this.steerAngle);
        if (this.isExpanded) this.drawJoystick('steer', -1, 0);
      } else if (['d', 'arrowright'].includes(k)) {
        e.preventDefault();
        this.steerAngle = this.maxSpeed;
        this.sendSteer(this.steerAngle);
        if (this.isExpanded) this.drawJoystick('steer', 1, 0);
      } else if (k === ' ' || k === 'spacebar') {
        e.preventDefault();
        this.sendStop();
      }
    },
    onKeyUp(e) {
      if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      const k = e.key.toLowerCase();
      if (['w', 's', 'arrowup', 'arrowdown'].includes(k)) {
        this.driveSpeed = 0;
        this.sendDrive(0);
        if (this.isExpanded) this.drawJoystick('drive', 0, 0);
      } else if (['a', 'q', 'd', 'arrowleft', 'arrowright'].includes(k)) {
        this.steerAngle = 0;
        this.sendSteer(0);
        if (this.isExpanded) this.drawJoystick('steer', 0, 0);
      }
    },
  },
};
</script>

<style scoped>
.robot-widget-wrapper {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 99999;
  user-select: none;
  font-family: inherit;
}

/* FAB */
.robot-floating-fab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 30px;
  background: linear-gradient(135deg, #0284c7, #0369a1);
  color: #fff;
  box-shadow: 0 10px 25px rgba(2, 132, 199, 0.45);
  cursor: pointer;
  border: 2px solid rgba(255,255,255,0.25);
  transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
  position: relative;
}
.robot-floating-fab:hover {
  transform: translateY(-3px) scale(1.04);
  box-shadow: 0 14px 30px rgba(2,132,199,0.6);
  background: linear-gradient(135deg, #38bdf8, #0284c7);
}
.fab-icon  { font-size: 20px; }
.fab-text  { font-weight: 700; font-size: 14px; letter-spacing: 0.5px; }
.fab-pulse {
  position: absolute; top: -3px; right: -3px;
  width: 12px; height: 12px; border-radius: 50%;
  background: #22c55e; border: 2px solid #fff;
  animation: pulse-ring 1.8s infinite;
}
@keyframes pulse-ring {
  0%   { transform: scale(0.9); opacity: 1; }
  100% { transform: scale(1.6); opacity: 0; }
}

/* Panel */
.robot-floating-panel {
  width: 340px;
  background: #181824;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 20px;
  box-shadow: 0 25px 50px rgba(0,0,0,0.6);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: #f8fafc;
  animation: slide-up 0.25s ease-out;
}
@keyframes slide-up {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* Header */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.panel-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 14px;
  color: #38bdf8;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.minimize-btn {
  background: rgba(255,255,255,0.1);
  border: none;
  color: #94a3b8;
  width: 26px; height: 26px;
  border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}
.minimize-btn:hover { background: rgba(255,255,255,0.2); color: #fff; }

/* Battery */
.battery-pill {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  background: rgba(255,255,255,0.08);
  color: #94a3b8;
}
.battery-pill.bat-ok   { background: rgba(34,197,94,0.15);  color: #22c55e; }
.battery-pill.bat-low  { background: rgba(234,179,8,0.15);  color: #eab308; }
.battery-pill.bat-crit { background: rgba(239,68,68,0.15);  color: #ef4444; animation: blink 1s infinite; }
@keyframes blink { 50% { opacity: 0.4; } }

/* Status row */
.status-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.status-chip {
  flex: 1;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  padding: 6px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.status-chip.active { border-color: #38bdf8; }
.chip-label { font-size: 9px; color: #64748b; text-transform: uppercase; }
.chip-val   { font-size: 14px; font-weight: 700; color: #38bdf8; }
.stop-pill {
  background: radial-gradient(circle, #dc2626, #991b1b);
  border: 2px solid #ef4444;
  border-radius: 50%;
  width: 46px; height: 46px;
  color: #fff;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 0 16px rgba(239,68,68,0.4);
  transition: transform 0.1s;
}
.stop-pill:hover  { background: radial-gradient(circle, #ef4444, #b91c1c); transform: scale(1.08); }
.stop-pill:active { transform: scale(0.95); }
.stop-pill i { font-size: 16px; }

/* Joystick zone */
.joystick-zone {
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: 12px;
}
.joystick-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.joystick-label {
  font-size: 10px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 4px;
}
.joystick-canvas {
  border-radius: 50%;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  cursor: crosshair;
  touch-action: none;
}

/* Speed row */
.speed-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ctrl-label { font-size: 11px; color: #cbd5e1; white-space: nowrap; }
.mini-slider { flex: 1; }
.speed-badge {
  background: rgba(56,189,248,0.2);
  color: #38bdf8;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 700;
  font-size: 11px;
}

/* Footer tip */
.panel-footer-tip {
  font-size: 10px;
  color: #64748b;
  text-align: center;
}
</style>
