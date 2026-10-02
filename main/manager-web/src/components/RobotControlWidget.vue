<template>
  <div class="robot-widget-wrapper" v-if="isLoggedIn">
    <!-- Collapsed Floating Pill/Button -->
    <div
      v-if="!isExpanded"
      class="robot-floating-fab"
      @click="isExpanded = true"
      title="Contrôle Moteurs Robot (Flèches)"
    >
      <span class="fab-icon">🎮</span>
      <span class="fab-text">{{ $t('header.robotControl') || 'Robot' }}</span>
      <span class="fab-pulse"></span>
    </div>

    <!-- Expanded Floating D-Pad Control Card -->
    <div v-else class="robot-floating-panel">
      <!-- Panel Header -->
      <div class="panel-header">
        <div class="panel-title">
          <span class="title-icon">🎮</span>
          <span>{{ $t('robot.title') || 'Contrôle Robot' }}</span>
        </div>
        <div class="header-actions">
          <button class="minimize-btn" @click="isExpanded = false" title="Minimiser">
            <i class="el-icon-minus"></i>
          </button>
        </div>
      </div>

      <!-- Live Movement Status Pill -->
      <div class="widget-status" :class="movementState">
        <span class="status-indicator-dot"></span>
        <span class="status-label">{{ currentStatusText }}</span>
        <span class="speed-badge">{{ speed }}%</span>
      </div>

      <!-- Arrow Controls (D-Pad) -->
      <div class="dpad-box">
        <!-- Up / Forward (Devant) -->
        <button
          class="arrow-btn btn-up"
          :class="{ pressed: activeKey === 'forward' }"
          @click="sendMove('forward')"
          @mousedown="startContinuous('forward')"
          @mouseup="stopContinuous"
          @mouseleave="stopContinuous"
          @touchstart.prevent="startContinuous('forward')"
          @touchend.prevent="stopContinuous"
          title="Devant / Avancer (↑ ou Z / W)"
        >
          <i class="el-icon-top"></i>
          <span class="dir-text">{{ $t('robot.forward') || 'Devant' }}</span>
        </button>

        <!-- Middle Row: Left, STOP, Right -->
        <div class="dpad-mid">
          <!-- Left (Gauche) -->
          <button
            class="arrow-btn btn-left"
            :class="{ pressed: activeKey === 'left' }"
            @click="sendMove('left')"
            @mousedown="startContinuous('left')"
            @mouseup="stopContinuous"
            @mouseleave="stopContinuous"
            @touchstart.prevent="startContinuous('left')"
            @touchend.prevent="stopContinuous"
            title="Gauche / Tourner à gauche (← ou Q / A)"
          >
            <i class="el-icon-back"></i>
            <span class="dir-text">{{ $t('robot.left') || 'Gauche' }}</span>
          </button>

          <!-- Center STOP Button -->
          <button
            class="arrow-btn btn-stop"
            :class="{ pressed: activeKey === 'stop' }"
            @click="sendStop"
            title="ARRÊT D'URGENCE (Espace)"
          >
            <i class="el-icon-video-pause"></i>
            <span class="stop-text">{{ $t('robot.stop') || 'STOP' }}</span>
          </button>

          <!-- Right (Droite) -->
          <button
            class="arrow-btn btn-right"
            :class="{ pressed: activeKey === 'right' }"
            @click="sendMove('right')"
            @mousedown="startContinuous('right')"
            @mouseup="stopContinuous"
            @mouseleave="stopContinuous"
            @touchstart.prevent="startContinuous('right')"
            @touchend.prevent="stopContinuous"
            title="Droite / Tourner à droite (→ ou D)"
          >
            <i class="el-icon-right"></i>
            <span class="dir-text">{{ $t('robot.right') || 'Droite' }}</span>
          </button>
        </div>

        <!-- Down / Backward (Arrière) -->
        <button
          class="arrow-btn btn-down"
          :class="{ pressed: activeKey === 'backward' }"
          @click="sendMove('backward')"
          @mousedown="startContinuous('backward')"
          @mouseup="stopContinuous"
          @mouseleave="stopContinuous"
          @touchstart.prevent="startContinuous('backward')"
          @touchend.prevent="stopContinuous"
          title="Arrière / Reculer (↓ ou S)"
        >
          <i class="el-icon-bottom"></i>
          <span class="dir-text">{{ $t('robot.backward') || 'Arrière' }}</span>
        </button>
      </div>

      <!-- Speed & Duration controls -->
      <div class="panel-controls">
        <div class="control-row">
          <span class="ctrl-label"><i class="el-icon-odometer"></i> {{ $t('robot.speed') || 'Vitesse' }}:</span>
          <el-slider
            v-model="speed"
            :min="20"
            :max="100"
            :step="5"
            size="small"
            class="mini-slider"
          ></el-slider>
        </div>

        <div class="control-row duration-row">
          <span class="ctrl-label"><i class="el-icon-time"></i> {{ $t('robot.duration') || 'Pas' }}:</span>
          <el-radio-group v-model="durationMs" size="mini">
            <el-radio-button :label="500">0.5s</el-radio-button>
            <el-radio-button :label="1000">1s</el-radio-button>
            <el-radio-button :label="1500">1.5s</el-radio-button>
            <el-radio-button :label="0">{{ $t('robot.continuous') || 'Cont.' }}</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- Keyboard shortcuts tip -->
      <div class="panel-footer-tip">
        <i class="el-icon-info"></i> {{ $t('robot.keyboardTip') || 'Flèches ou Z/Q/S/D pour piloter, Espace pour Stop' }}
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
      speed: 80,
      durationMs: 1500,
      movementState: 'stopped', // 'stopped', 'forward', 'backward', 'left', 'right'
      activeKey: null,
      continuousTimer: null,
      serverUrl: window.location.hostname
        ? `http://${window.location.hostname}:8003`
        : 'http://localhost:8003',
    };
  },
  computed: {
    isLoggedIn() {
      if (this.$route && ['/login', '/register', '/retrieve-password'].includes(this.$route.path)) {
        return false;
      }
      return Boolean(
        localStorage.getItem('token') ||
        sessionStorage.getItem('token') ||
        localStorage.getItem('userInfo') ||
        (this.$store && this.$store.state && this.$store.state.userInfo && this.$store.state.userInfo.username) ||
        (this.$route && this.$route.path && this.$route.path !== '/login')
      );
    },
    currentStatusText() {
      switch (this.movementState) {
        case 'forward':
          return this.$t('robot.movingForward') || 'Devant (Avance)';
        case 'backward':
          return this.$t('robot.movingBackward') || 'Arrière (Recul)';
        case 'left':
          return this.$t('robot.turningLeft') || 'Gauche';
        case 'right':
          return this.$t('robot.turningRight') || 'Droite';
        default:
          return this.$t('robot.stopped') || 'Moteurs à l’arrêt';
      }
    },
  },
  watch: {
    isExpanded(val) {
      if (val) {
        this.bindKeyboard();
      } else {
        this.unbindKeyboard();
        this.stopContinuous();
      }
    },
  },
  mounted() {
    // Listen for custom global event to open controller
    if (this.$eventBus) {
      this.$eventBus.$on('openRobotController', () => {
        this.isExpanded = true;
      });
    }
  },
  beforeDestroy() {
    this.unbindKeyboard();
    this.stopContinuous();
  },
  methods: {
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

      const payload = {
        direction: direction,
        speed: this.speed,
        duration_ms: this.durationMs,
      };

      try {
        await fetch(`${this.serverUrl}/xiaozhi/robot/move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        try {
          await fetch('/xiaozhi/robot/move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        } catch (e) {
          // ignore network failure
        }
      }

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
        await fetch(`${this.serverUrl}/xiaozhi/robot/stop`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
      } catch (err) {
        try {
          await fetch('/xiaozhi/robot/stop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          });
        } catch (e) {
          // ignore
        }
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
  font-family: inherit;
  user-select: none;
}

/* Floating Action Button (Collapsed) */
.robot-floating-fab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 30px;
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  color: #ffffff;
  box-shadow: 0 10px 25px rgba(2, 132, 199, 0.45);
  cursor: pointer;
  border: 2px solid rgba(255, 255, 255, 0.25);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.robot-floating-fab:hover {
  transform: translateY(-3px) scale(1.04);
  box-shadow: 0 14px 30px rgba(2, 132, 199, 0.6);
  background: linear-gradient(135deg, #38bdf8 0%, #0284c7 100%);
}

.fab-icon {
  font-size: 20px;
}

.fab-text {
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.5px;
}

.fab-pulse {
  position: absolute;
  top: -3px;
  right: -3px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #22c55e;
  border: 2px solid #ffffff;
  animation: pulse-ring 1.8s infinite;
}

@keyframes pulse-ring {
  0% { transform: scale(0.9); opacity: 1; }
  100% { transform: scale(1.6); opacity: 0; }
}

/* Expanded Floating D-Pad Panel */
.robot-floating-panel {
  width: 320px;
  background: #181824;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.6);
  padding: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #f8fafc;
  animation: slide-up 0.25s ease-out;
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.panel-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 15px;
  color: #38bdf8;
}

.minimize-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #94a3b8;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.minimize-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

/* Status Pill */
.widget-status {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  font-size: 12px;
}

.status-indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #64748b;
}

.widget-status.forward .status-indicator-dot,
.widget-status.backward .status-indicator-dot,
.widget-status.left .status-indicator-dot,
.widget-status.right .status-indicator-dot {
  background: #38bdf8;
  box-shadow: 0 0 8px #38bdf8;
}

.speed-badge {
  background: rgba(56, 189, 248, 0.2);
  color: #38bdf8;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 700;
  font-size: 11px;
}

/* D-Pad Buttons Box */
.dpad-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin: 6px 0;
}

.dpad-mid {
  display: flex;
  align-items: center;
  gap: 8px;
}

.arrow-btn {
  width: 72px;
  height: 72px;
  border-radius: 14px;
  background: linear-gradient(135deg, #262738 0%, #1c1d2c 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #f1f5f9;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  outline: none;
  transition: all 0.12s ease;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
}

.arrow-btn i {
  font-size: 24px;
  color: #38bdf8;
  margin-bottom: 2px;
}

.dir-text {
  font-size: 10px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
}

.arrow-btn:hover {
  background: linear-gradient(135deg, #32344a 0%, #222336 100%);
  border-color: #38bdf8;
  transform: translateY(-2px);
}

.arrow-btn:active,
.arrow-btn.pressed {
  background: #38bdf8;
  color: #0f172a;
  transform: translateY(2px);
}

.arrow-btn:active i,
.arrow-btn.pressed i,
.arrow-btn:active .dir-text,
.arrow-btn.pressed .dir-text {
  color: #0f172a;
}

/* STOP Button */
.btn-stop {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  border: 2px solid #ef4444;
  background: radial-gradient(circle, #dc2626 0%, #991b1b 100%);
  box-shadow: 0 0 16px rgba(239, 68, 68, 0.45);
}

.btn-stop i {
  font-size: 26px;
  color: #ffffff;
}

.stop-text {
  font-size: 10px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: 0.5px;
}

.btn-stop:hover {
  background: radial-gradient(circle, #ef4444 0%, #b91c1c 100%);
  transform: scale(1.05);
}

.btn-stop:active,
.btn-stop.pressed {
  transform: scale(0.95);
}

/* Controls */
.panel-controls {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(255, 255, 255, 0.03);
  padding: 10px 12px;
  border-radius: 10px;
}

.control-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.ctrl-label {
  font-size: 11px;
  color: #cbd5e1;
  white-space: nowrap;
}

.mini-slider {
  flex: 1;
}

.duration-row {
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.duration-row >>> .el-radio-group {
  width: 100%;
  display: flex;
}

.duration-row >>> .el-radio-button {
  flex: 1;
}

.duration-row >>> .el-radio-button__inner {
  width: 100%;
  padding: 5px 0;
  font-size: 11px;
  background: #1e1e2d;
  color: #94a3b8;
  border-color: rgba(255, 255, 255, 0.15);
}

.duration-row >>> .el-radio-button__orig-radio:checked + .el-radio-button__inner {
  background: #38bdf8;
  color: #0f172a;
  border-color: #38bdf8;
  font-weight: 700;
}

.panel-footer-tip {
  font-size: 10px;
  color: #64748b;
  text-align: center;
  line-height: 1.3;
}
</style>
