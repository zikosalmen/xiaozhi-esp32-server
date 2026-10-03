<template>
  <el-header class="header">
    <div class="header-container">
      <!-- section -->
      <div class="header-left" @click="handleRouter('home')">
        <img loading="lazy" alt="" src="@/assets/xiaozhi-logo.png" class="logo-img" />
        <img loading="lazy" alt="" :src="xiaozhiAiIcon" class="brand-img" />
      </div>

      <!-- section -->
      <div class="header-center">
        <div class="equipment-management" :class="{
          'active-tab':
            $route.path === '/home' ||
            $route.path === '/role-config' ||
            $route.path === '/device-management',
        }" @click="handleRouter('home')">
          <img loading="lazy" alt="" src="@/assets/header/robot.png" :style="{
            filter:
              $route.path === '/home' ||
                $route.path === '/role-config' ||
                $route.path === '/device-management'
                ? 'brightness(0) invert(1)'
                : 'None',
          }" />
          <span class="nav-text">{{ $t("header.smartManagement") }}</span>
        </div>
        <!-- section -->
        <div v-if="!userInfo.superAdmin && featureStatus.voiceClone" class="equipment-management"
          :class="{ 'active-tab': $route.path === '/voice-clone-management' }"
          @click="handleRouter('voiceCloneManagement')">
          <img loading="lazy" alt="" src="@/assets/header/voice.png" :style="{
            filter:
              $route.path === '/voice-clone-management'
                ? 'brightness(0) invert(1)'
                : 'None',
          }" />
          <span class="nav-text">{{ $t("header.voiceCloneManagement") }}</span>
        </div>

        <!-- section -->
        <el-dropdown v-if="userInfo.superAdmin && featureStatus.voiceClone" trigger="click"
          class="equipment-management more-dropdown" :class="{
            'active-tab':
              $route.path === '/voice-clone-management' ||
              $route.path === '/voice-resource-management',
          }" @visible-change="handleVoiceCloneDropdownVisibleChange">
          <span class="el-dropdown-link">
            <img loading="lazy" alt="" src="@/assets/header/voice.png" :style="{
              filter:
                $route.path === '/voice-clone-management' ||
                  $route.path === '/voice-resource-management'
                  ? 'brightness(0) invert(1)'
                  : 'None',
            }" />
            <span class="nav-text">{{ $t("header.voiceCloneManagement") }}</span>
            <i class="el-icon-arrow-down" :class="{ 'rotate-down': voiceCloneDropdownVisible }"></i>
          </span>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item @click.native="handleRouter('voiceCloneManagement')">
              {{ $t("header.voiceCloneManagement") }}
            </el-dropdown-item>
            <el-dropdown-item @click.native="handleRouter('voiceResourceManagement')">
              {{ $t("header.voiceResourceManagement") }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>

        <div v-if="userInfo.superAdmin" class="equipment-management"
          :class="{ 'active-tab': $route.path === '/model-config' }" @click="handleRouter('modelConfig')">
          <img loading="lazy" alt="" src="@/assets/header/model_config.png" :style="{
            filter:
              $route.path === '/model-config' ? 'brightness(0) invert(1)' : 'None',
          }" />
          <span class="nav-text">{{ $t("header.modelConfig") }}</span>
        </div>
        <div v-if="featureStatus.knowledgeBase" class="equipment-management"
          :class="{ 'active-tab': $route.path === '/knowledge-base-management' || $route.path === '/knowledge-file-upload' }"
          @click="handleRouter('knowledgeBaseManagement')">
          <img loading="lazy" alt="" src="@/assets/header/knowledge_base.png" :style="{
            filter:
              $route.path === '/knowledge-base-management' || $route.path === '/knowledge-file-upload' ? 'brightness(0) invert(1)' : 'None',
          }" />
          <span class="nav-text">{{ $t("header.knowledgeBase") }}</span>
        </div>
        <div v-if="featureStatus.addressBook" class="equipment-management"
          :class="{ 'active-tab': $route.path === '/address-book-management' }"
          @click="handleRouter('addressBookManagement')">
          <img loading="lazy" alt="" src="@/assets/header/address_book.png" :style="{
            filter:
              $route.path === '/address-book-management' ? 'brightness(0) invert(1)' : 'None',
          }" />
          <span class="nav-text">{{ $t("header.addressBook") }}</span>
        </div>

        <!-- Contrôle Robot (Flèches / Moteurs) -->
        <div class="equipment-management" @click="isRobotControlVisible = true" style="cursor: pointer;">
          <i class="el-icon-aim" style="font-size: 20px; margin-right: 6px; color: #38bdf8;"></i>
          <span class="nav-text">{{ $t("header.robotControl") || "Robot" }}</span>
        </div>
        <el-dropdown v-if="userInfo.superAdmin" trigger="click" class="equipment-management more-dropdown" :class="{
          'active-tab':
            $route.path === '/dict-management' ||
            $route.path === '/params-management' ||
            $route.path === '/provider-management' ||
            $route.path === '/server-side-management' ||
            $route.path === '/agent-template-management' ||
            $route.path === '/ota-management' ||
            $route.path === '/user-management' ||
            $route.path === '/feature-management' ||
            $route.path === '/replacement-word-management'
        }" @visible-change="handleParamDropdownVisibleChange">
          <span class="el-dropdown-link">
            <img loading="lazy" alt="" src="@/assets/header/param_management.png" :style="{
              filter:
                $route.path === '/dict-management' ||
                  $route.path === '/params-management' ||
                  $route.path === '/provider-management' ||
                  $route.path === '/server-side-management' ||
                  $route.path === '/agent-template-management' ||
                  $route.path === '/ota-management' ||
                  $route.path === '/user-management' ||
                  $route.path === '/feature-management' ||
                  $route.path === '/replacement-word-management'
                  ? 'brightness(0) invert(1)'
                  : 'None',
            }" />
            <span class="nav-text">{{ $t("header.paramDictionary") }}</span>
            <i class="el-icon-arrow-down" :class="{ 'rotate-down': paramDropdownVisible }"></i>
          </span>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item @click.native="handleRouter('paramManagement')">
              {{ $t("header.paramManagement") }}
            </el-dropdown-item>
            <el-dropdown-item @click.native="handleRouter('userManagement')">
              {{ $t("header.userManagement") }}
            </el-dropdown-item>
            <el-dropdown-item @click.native="handleRouter('otaManagement')">
              {{ $t("header.otaManagement") }}
            </el-dropdown-item>
            <el-dropdown-item @click.native="handleRouter('dictManagement')">
              {{ $t("header.dictManagement") }}
            </el-dropdown-item>
            <el-dropdown-item @click.native="handleRouter('providerManagement')">
              {{ $t("header.providerManagement") }}
            </el-dropdown-item>
            <el-dropdown-item @click.native="handleRouter('agentTemplate')">
              {{ $t("header.agentTemplate") }}
            </el-dropdown-item>
            <el-dropdown-item @click.native="handleRouter('replacementWordManagement')">
              {{ $t("header.replacementWordManagement") }}
            </el-dropdown-item>
            <el-dropdown-item @click.native="handleRouter('serverSideManagement')">
              {{ $t("header.serverSideManagement") }}
            </el-dropdown-item>
            <el-dropdown-item @click.native="handleRouter('featureManagement')">
              {{ $t("header.featureManagement") }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>

      <!-- section -->
      <div class="header-right">
        <img loading="lazy" alt="" src="@/assets/home/avatar.png" class="avatar-img" @click="handleAvatarClick" />
        <span class="el-user-dropdown" @click="handleAvatarClick">
          {{ userInfo.username || $t('common.loading') }}
          <i class="el-icon-arrow-down el-icon--right" :class="{ 'rotate-down': userMenuVisible }"></i>
        </span>
        <el-cascader :options="userMenuOptions" trigger="click" :props="cascaderProps"
          style="width: 0px; overflow: hidden" :show-all-levels="false" @change="handleCascaderChange"
          @visible-change="handleUserMenuVisibleChange" ref="userCascader">
          <template slot-scope="{ data }">
            <span>{{ data.label }}</span>
          </template>
        </el-cascader>
      </div>
    </div>

    <!-- section -->
    <ChangePasswordDialog v-model="isChangePasswordDialogVisible" />
    <!-- Contrôle Robot Moteurs -->
    <RobotControlDialog :visible.sync="isRobotControlVisible" />
  </el-header>
</template>

<script>
import i18n, { changeLanguage } from "@/i18n";
import featureManager from "@/utils/featureManager"; // 引入功能管理工具// [comment]
import { mapActions, mapState } from "vuex";
import ChangePasswordDialog from "./ChangePasswordDialog.vue"; // 引入修改密码弹窗组// [comment]
import RobotControlDialog from "./RobotControlDialog.vue"; // 机器人电机控制组// [comment]

export default {
  name: "HeaderBar",
  components: {
    ChangePasswordDialog,
    RobotControlDialog,
  },
  props: ["devices"], // 接收父组件设备列// [comment]
  data() {
    return {
      search: "",
      isChangePasswordDialogVisible: false, // 控制修改密码弹窗的显// [comment]
      isRobotControlVisible: false, // 控制机器人控制弹窗的显// [comment]
      paramDropdownVisible: false,
      voiceCloneDropdownVisible: false,
      userMenuVisible: false, // 添加用户菜单可见状// [comment]
      menuVisibleTimer: null, // 菜单显示定时器，防止够快触// [comment]，[comment]
      // Cascader [text]
      cascaderProps: {
        expandTrigger: "click",
        value: "value",
        label: "label",
        children: "children",
      },
      // [text]
      routerPaths: {
        home: "/home",
        modelConfig: "/model-config",
        knowledgeBaseManagement: "/knowledge-base-management",
        addressBookManagement: "/address-book-management",
        voiceCloneManagement: "/voice-clone-management",
        voiceResourceManagement: "/voice-resource-management",
        paramManagement: "/params-management",
        userManagement: "/user-management",
        otaManagement: "/ota-management",
        dictManagement: "/dict-management",
        providerManagement: "/provider-management",
        agentTemplate: "/agent-template-management",
        replacementWordManagement: "/replacement-word-management",
        serverSideManagement: "/server-side-management",
        featureManagement: "/feature-management",
      }
    };
  },
  computed: {
    ...mapState({
      featureStatus: (state) => ({
        voiceClone: state.pubConfig.systemWebMenu?.features?.voiceClone?.enabled, // 音色克隆功能状// [comment]
        knowledgeBase: state.pubConfig.systemWebMenu?.features?.knowledgeBase?.enabled, // 知识库功能状// [comment]
        addressBook: state.pubConfig.systemWebMenu?.features?.addressBook?.enabled, // 通讯录功能状// [comment]
      }),
      userInfo: (state) => state.userInfo,
    }),
    // [text]
    currentLanguage() {
      return i18n.locale || "en";
    },
    // [text]
    currentLanguageText() {
      const currentLang = this.currentLanguage;
      switch (currentLang) {
        case "fr":
          return this.$t("language.fr") || "Français";
        case "ar":
          return this.$t("language.ar") || "العربية";
        case "en":
        default:
          return this.$t("language.en") || "English";
      }
    },
    // [text]xiaozhi-ai[text]
    xiaozhiAiIcon() {
      return require("@/assets/xiaozhi-ai_en.png");
    },
    // [text]
    userMenuOptions() {
      return [
        {
          label: this.currentLanguageText,
          value: "language",
          children: [
            {
              label: this.$t("language.en") || "English",
              value: "en",
            },
            {
              label: this.$t("language.fr") || "Français",
              value: "fr",
            },
            {
              label: this.$t("language.ar") || "العربية",
              value: "ar",
            },
          ],
        },
        {
          label: this.$t("header.changePassword"),
          value: "changePassword",
        },
        {
          label: this.$t("header.logout"),
          value: "logout",
        },
      ];
    },
  },
  async mounted() {
    // [text]featureManager[text]
    await this.loadFeatureStatus();
  },
  methods: {
    handleRouter(type) {
      this.$router.push(this.routerPaths[type]);
    },
    // [text]
    async loadFeatureStatus() {
      // [text]featureManager[text]
      await featureManager.waitForInitialization();
    },
    // [text]
    showChangePasswordDialog() {
      this.isChangePasswordDialogVisible = true;
      // [text]：[text]
      this.userMenuVisible = false;
    },
    // [text]
    async handleLogout() {
      try {
        // [text] Vuex [text] logout action
        await this.logout();
        this.$message.success({
          message: this.$t("message.success"),
          showClose: true,
        });
      } catch (error) {
        console.error("退出登录失败:", error);
        this.$message.error({
          message: this.$t("message.error"),
          showClose: true,
        });
      }
    },
    // [text]
    handleParamDropdownVisibleChange(visible) {
      this.paramDropdownVisible = visible;
    },

    // [text]
    handleVoiceCloneDropdownVisibleChange(visible) {
      this.voiceCloneDropdownVisible = visible;
    },
    // [text]data[text]key[text]
    // [text] Cascader [text]
    handleCascaderChange(value) {
      if (!value || value.length === 0) {
        return;
      }

      const action = value[value.length - 1];

      // [text]
      if (value.length === 2 && value[0] === "language") {
        this.changeLanguage(action);
      } else {
        // [text]
        switch (action) {
          case "changePassword":
            this.showChangePasswordDialog();
            break;
          case "logout":
            this.handleLogout();
            break;
        }
      }

      // [text]
      setTimeout(() => {
        this.completeResetCascader();
      }, 300);
    },

    // [text]
    changeLanguage(lang) {
      changeLanguage(lang);
      this.$message.success({
        message: this.$t("message.success"),
        showClose: true,
      });
      // [text]：[text]
      this.userMenuVisible = false;
    },

    // [text]
    completeResetCascader() {
      if (this.$refs.userCascader) {
        try {
          // [text]
          // 1. [text]clearValue[text]
          if (this.$refs.userCascader.clearValue) {
            this.$refs.userCascader.clearValue();
          }

          // 2. [text]
          if (this.$refs.userCascader.$data) {
            this.$refs.userCascader.$data.selectedPaths = [];
            this.$refs.userCascader.$data.displayLabels = [];
            this.$refs.userCascader.$data.inputValue = "";
            this.$refs.userCascader.$data.checkedValue = [];
            this.$refs.userCascader.$data.showAllLevels = false;
          }

          // 3. [text]DOM[text]
          const menuElement = this.$refs.userCascader.$refs.menu;
          if (menuElement && menuElement.$el) {
            const activeItems = menuElement.$el.querySelectorAll(
              ".el-cascader-node.is-active"
            );
            activeItems.forEach((item) => item.classList.remove("is-active"));

            const checkedItems = menuElement.$el.querySelectorAll(
              ".el-cascader-node.is-checked"
            );
            checkedItems.forEach((item) => item.classList.remove("is-checked"));
          }

          console.log("Cascader values cleared");
        } catch (error) {
          console.error("清空选择值失败:", error);
        }
      }
    },

    // [text]cascader[text]
    handleAvatarClick() {
      if (this.$refs.userCascader) {
        // [text]
        this.userMenuVisible = !this.userMenuVisible;

        // [text]
        if (!this.userMenuVisible) {
          this.completeResetCascader();
        }

        // [text]
        try {
          // [text]toggleDropDownVisible[text]
          this.$refs.userCascader.toggleDropDownVisible(this.userMenuVisible);
        } catch (error) {
          // [text]toggle[text]，[text]
          if (this.$refs.userCascader.$refs.menu) {
            this.$refs.userCascader.$refs.menu.showMenu(this.userMenuVisible);
          } else {
            console.error("Cannot access menu component");
          }
        }
      }
    },

    // [text]
    handleUserMenuVisibleChange(visible) {
      if (this.menuVisibleTimer) return;
      this.menuVisibleTimer = setTimeout(() => {
        this.userMenuVisible = visible;
        clearTimeout(this.menuVisibleTimer);
        this.menuVisibleTimer = null;
      }, 100);

      // [text]，[text]
      if (!visible) {
        this.completeResetCascader();
      }
    },

    // [text] mapActions [text] Vuex [text] logout action
    ...mapActions(["logout"]),
  },
};
</script>

<style lang="scss" scoped>
.header {
  background: linear-gradient(180deg, #dfeafe, #eff4ff);
  height: 63px !important;
  min-width: 900px;
  overflow: visible;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 10px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 130px;
  cursor: pointer;
}

.logo-img {
  width: 42px;
  height: 42px;
}

.brand-img {
  height: 20px;
}

.header-center {
  display: flex;
  align-items: center;
  gap: 25px;
  background: white;
  border-radius: 30px;
  box-shadow: 0 0 6px 0px #cfe1fb;
  padding: 4px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 7px;
  justify-content: flex-end;
}

.equipment-management {
  padding: 8px 16px;
  border-radius: 30px;
  display: flex;
  justify-content: center;
  font-size: 16px;
  font-weight: 500;
  gap: 7px;
  color: #6c79a8;
  margin-left: 1px;
  align-items: center;
  transition: all 0.3s ease;
  cursor: pointer;
  flex-shrink: 0;
  position: relative;
}

.equipment-management.active-tab {
  color: #fff !important;
  background: linear-gradient(90deg, #2983fe 0%, #5251fc 100%);
  box-shadow: 0 1px 8px rgba(41, 131, 254, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;
}

.equipment-management.active-tab::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 100%);
  pointer-events: none;
}

.equipment-management img {
  width: 15px;
  height: 13px;
}

.avatar-img {
  width: 21px;
  height: 21px;
  flex-shrink: 0;
  cursor: pointer;
}

.el-user-dropdown {
  cursor: pointer;
}

/* [text] - [text] */
.nav-text {
  white-space: normal;
  text-align: center;
  line-height: 1.2;
}

.el-dropdown-link {
  display: flex;
  align-items: center;
  gap: 7px;
}

/* [text] */
@media (max-width: 1200px) {
  .header-center {
    gap: 14px;
  }

  .equipment-management {
    min-width: 80px;
    font-size: 10px;
  }
}

.equipment-management.more-dropdown {
  position: relative;
}

.equipment-management.more-dropdown .el-dropdown-menu {
  position: absolute;
  right: 0;
  min-width: 120px;
  margin-top: 5px;
}

.el-dropdown-menu__item {
  min-width: 60px;
  padding: 8px 20px;
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

/* [text] */
.rotate-down {
  transform: rotate(180deg);
  transition: transform 0.3s ease;
}

.el-icon-arrow-down {
  transition: transform 0.3s ease;
}
</style>
