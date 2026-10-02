<template>
  <el-dialog
    :visible.sync="visible"
    :title="$t('robot.title') || 'Contrôle Robot'"
    width="520px"
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
          <el-tag size="mini" :type="serverConnected ? 'success' : 'info'">
            <i class="el-icon-cpu"></i> {{ serverStatusText }}
          </el-tag>
        </div>
      </div>

      <!-- Arrow Controls Pad (D-Pad) -->
      <div class="dpad-container">
        <!-- Up / Forward -->
        <button
          class="dpad-btn btn-up"
          :class="{ active: activeKey === 'forward' }"
          @click="sendMove('forward')"
          @mousedown="startContinuous('forward')"
          @mouseup="stopContinuous"
          @mouseleave="stopContinuous"
          @touchstart.prevent="startContinuous('forward')"
          @touchend.prevent="stopContinuous"
          :title="$t('robot.forward') + ' (↑ / Z / W)'"
        >
          <i class="el-icon-top"></i>
          <span class="btn-label">{{ $t('robot.forward') }}</span>
        </button>

        <!-- Left & Right Middle Row with Center STOP -->
        <div class="dpad-mid-row">
          <!-- Left -->
          <button
            class="dpad-btn btn-left"
            :class="{ active: activeKey === 'left' }"
            @click="sendMove('left')"
            @mousedown="startContinuous('left')"
            @mouseup="stopContinuous"
            @mouseleave="stopContinuous"
            @touchstart.prevent="startContinuous('left')"
            @touchend.prevent="stopContinuous"
            :title="$t('robot.left') + ' (← / Q / A)'"
          >
            <i class="el-icon-back"></i>
            <span class="btn-label">{{ $t('robot.left') }}</span>
          </button>

          <!-- Center STOP Button -->
          <button
            class="dpad-btn btn-stop"
            :class="{ active: activeKey === 'stop' }"
            @click="sendStop"
            :title="$t('robot.stop') + ' (Espace / Space)'"
          >
            <i class="el-icon-video-pause"></i>
            <span class="btn-label-stop">{{ $t('robot.stop') }}</span>
          </button>

          <!-- Right -->
          <button
            class="dpad-btn btn-right"
            :class="{ active: activeKey === 'right' }"
            @click="sendMove('right')"
            @mousedown="startContinuous('right')"
            @mouseup="stopContinuous"
            @mouseleave="stopContinuous"
            @touchstart.prevent="startContinuous('right')"
            @touchend.prevent="stopContinuous"
            :title="$t('robot.right') + ' (→ / D)'"
          >
            <i class="el-icon-right"></i>
            <span class="btn-label">{{ $t('robot.right') }}</span>
          </button>
        </div>

        <!-- Down / Backward -->
        <button
          class="dpad-btn btn-down"
          :class="{ active: activeKey === 'backward' }"
          @click="sendMove('backward')"
          @mousedown="startContinuous('backward')"
          @mouseup="stopContinuous"
          @mouseleave="stopContinuous"
          @touchstart.prevent="startContinuous('backward')"
          @touchend.prevent="stopContinuous"
          :title="$t('robot.backward') + ' (↓ / S)'"
        >
          <i class="el-icon-bottom"></i>
          <span class="btn-label">{{ $t('robot.backward') }}</span>
        </button>
      </div>

      <!-- Speed & Duration Settings -->
      <div class="settings-box">
        <div class="setting-item">
          <div class="setting-header">
            <span><i class="el-icon-odometer"></i> {{ $t('robot.speed') }}</span>
            <span class="setting-value">{{ speed }}%</span>
          </div>
          <el-slider
            v-model="speed"
            :min="20"
            :max="100"
            :step="5"
            show-stops
            class="speed-slider"
          ></el-slider>
        </div>

        <div class="setting-item">
          <div class="setting-header">
            <span><i class="el-icon-time"></i> {{ $t('robot.duration') }}</span>
            <span class="setting-value">{{ durationMs > 0 ? durationMs + ' ms' : $t('robot.continuous') }}</span>
          </div>
          <el-radio-group v-model="durationMs" size="mini" class="duration-radios">
            <el-radio-button :label="500">500ms</el-radio-button>
            <el-radio-button :label="1000">1s</el-radio-button>
            <el-radio-button :label="1500">1.5s</el-radio-button>
            <el-radio-button :label="2000">2s</el-radio-button>
            <el-radio-button :label="0">{{ $t('robot.continuous') }}</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- Keyboard Tip -->
      <div class="keyboard-tip">
        <i class="el-icon-info"></i>
        <span>{{ $t('robot.keyboardTip') }}</span>
      </div>

      <!-- Quick Server URL Setting Accordion / Drawer -->
      <div class="server-config-section">
        <el-collapse v-model="activeCollapse">
          <el-collapse-item name="serverConfig">
            <template slot="title">
              <span class="collapse-title"><i class="el-icon-setting"></i> Paramètres de connexion serveur</span>
            </template>
            <div class="server-input-row">
              <el-input
                size="small"
                v-model="serverUrl"
                placeholder="http://<serveur-ip>:8003"
              >
                <template slot="prepend">URL</template>
              </el-input>
              <el-button size="small" type="primary" plain @click="testConnection">
                Tester
              </el-button>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: 'RobotControlDialog',
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    deviceId: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      speed: 80,
      durationMs: 1500,
      movementState: 'stopped', // 'stopped', 'forward', 'backward', 'left', 'right'
      activeKey: null,
      serverConnected: true,
      continuousTimer: null,
      activeCollapse: [],
      serverUrl: window.location.hostname
        ? `http://${window.location.hostname}:8003`
        : 'http://localhost:8003',
      logs: [],
    };
  },
  computed: {
    statusText() {
      switch (this.movementState) {
        case 'forward':
          return this.$t('robot.movingForward') || 'Avance en cours';
        case 'backward':
          return this.$t('robot.movingBackward') || 'Recul en cours';
        case 'left':
          return this.$t('robot.turningLeft') || 'Virage à gauche';
        case 'right':
          return this.$t('robot.turningRight') || 'Virage à droite';
        default:
          return this.$t('robot.stopped') || 'Moteurs à l’arrêt';
      }
    },
    serverStatusText() {
      return this.serverConnected ? 'ESP32 Prêt' : 'Serveur indisponible';
    },
  },
  watch: {
    visible(val) {
      if (val) {
        this.bindKeyboard();
        this.testConnection();
      } else {
        this.unbindKeyboard();
        this.stopContinuous();
      }
    },
  },
  beforeDestroy() {
    this.unbindKeyboard();
    this.stopContinuous();
  },
  methods: {
    handleClose() {
      this.sendStop();
      this.$emit('update:visible', false);
    },
    bindKeyboard() {
      window.addEventListener('keydown', this.handleKeyDown);
      window.addEventListener('keyup', this.handleKeyUp);
    },
    unbindKeyboard() {
      window.removeEventListener('keydown', this.handleKeyDown);
      window.removeEventListener('keyup', this.handleKeyUp);
    },
    handleKeyDown(e) {
      // Don't intercept if user is typing in an input
      if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      const key = e.key.toLowerCase();
      let direction = null;

      if (['arrowup', 'w', 'z'].includes(key)) {
        direction = 'forward';
      } else if (['arrowdown', 's'].includes(key)) {
        direction = 'backward';
      } else if (['arrowleft', 'a', 'q'].includes(key)) {
        direction = 'left';
      } else if (['arrowright', 'd'].includes(key)) {
        direction = 'right';
      } else if (key === ' ' || key === 'spacebar') {
        this.sendStop();
        e.preventDefault();
        return;
      }

      if (direction && this.activeKey !== direction) {
        e.preventDefault();
        this.sendMove(direction);
      }
    },
    handleKeyUp(e) {
      if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      const key = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'z', 'q'].includes(key)) {
        if (this.durationMs === 0) {
          this.sendStop();
        }
      }
    },
    startContinuous(dir) {
      this.sendMove(dir);
      if (this.durationMs === 0) {
        this.stopContinuous();
        this.continuousTimer = setInterval(() => {
          this.sendMove(dir, false);
        }, 800);
      }
    },
    stopContinuous() {
      if (this.continuousTimer) {
        clearInterval(this.continuousTimer);
        this.continuousTimer = null;
        if (this.durationMs === 0) {
          this.sendStop();
        }
      }
    },
    async sendMove(direction, updateVisualState = true) {
      if (updateVisualState) {
        this.movementState = direction;
        this.activeKey = direction;
      }

      try {
        const payload = {
          direction: direction,
          speed: this.speed,
          duration_ms: this.durationMs,
        };
        if (this.deviceId) {
          payload.device_id = this.deviceId;
        }

        // Try primary server URL (port 8003)
        const response = await fetch(`${this.serverUrl}/xiaozhi/robot/move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          this.serverConnected = true;
        }
      } catch (err) {
        console.warn('Direct port 8003 failed, trying relative /xiaozhi/robot/move:', err);
        try {
          await fetch('/xiaozhi/robot/move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          this.serverConnected = true;
        } catch (e) {
          this.serverConnected = false;
        }
      }

      // If duration is specified (> 0), reset state after duration
      if (this.durationMs > 0 && updateVisualState) {
        setTimeout(() => {
          if (this.movementState === direction) {
            this.movementState = 'stopped';
            this.activeKey = null;
          }
        }, this.durationMs);
      }
    },
    async sendStop() {
      this.movementState = 'stopped';
      this.activeKey = 'stop';
      setTimeout(() => {
        if (this.activeKey === 'stop') this.activeKey = null;
      }, 300);

      try {
        const payload = {};
        if (this.deviceId) payload.device_id = this.deviceId;

        await fetch(`${this.serverUrl}/xiaozhi/robot/stop`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        this.serverConnected = true;
      } catch (err) {
        try {
          await fetch('/xiaozhi/robot/stop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          this.serverConnected = true;
        } catch (e) {
          this.serverConnected = false;
        }
      }
    },
    async testConnection() {
      try {
        const res = await fetch(`${this.serverUrl}/xiaozhi/robot/status`);
        if (res.ok) {
          this.serverConnected = true;
        } else {
          this.serverConnected = false;
        }
      } catch (e) {
        this.serverConnected = false;
      }
    },
  },
};
</script>

<style scoped>
.robot-control-dialog >>> .el-dialog {
  border-radius: 16px;
  background: #1e1e2d;
  color: #fff;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.robot-control-dialog >>> .el-dialog__title {
  color: #f1f5f9;
  font-weight: 600;
  font-size: 18px;
}

.robot-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  padding: 0 10px;
}

/* Status Bar */
.robot-status-bar {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #94a3b8;
}

.pulse-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #94a3b8;
  display: inline-block;
}

.status-indicator.forward,
.status-indicator.backward,
.status-indicator.left,
.status-indicator.right {
  color: #38bdf8;
}

.status-indicator.forward .pulse-dot,
.status-indicator.backward .pulse-dot,
.status-indicator.left .pulse-dot,
.status-indicator.right .pulse-dot {
  background: #38bdf8;
  box-shadow: 0 0 10px #38bdf8;
  animation: pulse 1s infinite alternate;
}

@keyframes pulse {
  0% { transform: scale(0.9); opacity: 0.7; }
  100% { transform: scale(1.3); opacity: 1; }
}

/* D-Pad Container */
.dpad-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin: 10px 0;
  user-select: none;
}

.dpad-mid-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dpad-btn {
  width: 90px;
  height: 90px;
  border-radius: 18px;
  border: 2px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(135deg, #2a2b3d 0%, #1e1e2e 100%);
  color: #f1f5f9;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  outline: none;
  transition: all 0.15s ease;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.25);
}

.dpad-btn i {
  font-size: 28px;
  margin-bottom: 4px;
  color: #38bdf8;
}

.btn-label {
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
  text-transform: uppercase;
}

.dpad-btn:hover {
  background: linear-gradient(135deg, #373952 0%, #25263a 100%);
  border-color: #38bdf8;
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(56, 189, 248, 0.2);
}

.dpad-btn:active,
.dpad-btn.active {
  background: #38bdf8;
  color: #0f172a;
  transform: translateY(2px);
  box-shadow: 0 2px 6px rgba(56, 189, 248, 0.4);
}

.dpad-btn:active i,
.dpad-btn.active i,
.dpad-btn:active .btn-label,
.dpad-btn.active .btn-label {
  color: #0f172a;
}

/* STOP Button Special Styling */
.btn-stop {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  border: 3px solid #ef4444;
  background: radial-gradient(circle, #dc2626 0%, #991b1b 100%);
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.4);
}

.btn-stop i {
  font-size: 32px;
  color: #ffffff;
}

.btn-label-stop {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #ffffff;
}

.btn-stop:hover {
  background: radial-gradient(circle, #ef4444 0%, #b91c1c 100%);
  transform: scale(1.05);
  box-shadow: 0 0 25px rgba(239, 68, 68, 0.6);
}

.btn-stop:active,
.btn-stop.active {
  transform: scale(0.95);
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.8);
}

/* Settings Box */
.settings-box {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.setting-header {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 500;
  color: #cbd5e1;
  margin-bottom: 6px;
}

.setting-value {
  color: #38bdf8;
  font-weight: 600;
}

.duration-radios {
  display: flex;
  width: 100%;
}

.duration-radios >>> .el-radio-button {
  flex: 1;
}

.duration-radios >>> .el-radio-button__inner {
  width: 100%;
  background: #1e1e2d;
  color: #94a3b8;
  border-color: rgba(255, 255, 255, 0.15);
}

.duration-radios >>> .el-radio-button__orig-radio:checked + .el-radio-button__inner {
  background: #38bdf8;
  color: #0f172a;
  font-weight: 600;
  border-color: #38bdf8;
}

/* Keyboard Tip */
.keyboard-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #94a3b8;
  background: rgba(56, 189, 248, 0.08);
  border: 1px dashed rgba(56, 189, 248, 0.3);
  border-radius: 8px;
  padding: 8px 14px;
  width: 100%;
}

.keyboard-tip i {
  color: #38bdf8;
  font-size: 14px;
}

/* Server config */
.server-config-section {
  width: 100%;
}

.server-config-section >>> .el-collapse,
.server-config-section >>> .el-collapse-item__header,
.server-config-section >>> .el-collapse-item__wrap {
  background: transparent;
  border: none;
  color: #94a3b8;
}

.collapse-title {
  font-size: 12px;
  color: #64748b;
}

.server-input-row {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}
</style>
