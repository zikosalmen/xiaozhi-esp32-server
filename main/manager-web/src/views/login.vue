<template>
  <div class="welcome">
    <el-container style="height: 100%">
      <el-header>
        <div style="
            display: flex;
            align-items: center;
            margin-top: 11px;
            margin-left: 11px;
            gap: 10px;
          ">
          <img loading="lazy" alt="" src="@/assets/xiaozhi-logo.png" style="width: 42px; height: 42px" />
          <img loading="lazy" alt="" :src="xiaozhiAiIcon" style="height: 20px" />
        </div>
      </el-header>
      <div class="login-person">
        <img loading="lazy" alt="" src="@/assets/login/login-person.png" style="width: 100%" />
      </div>
      <el-main style="position: relative">
        <div class="login-box" @keyup.enter="login">
          <div style="
              display: flex;
              align-items: center;
              gap: 20px;
              margin-bottom: 39px;
              padding: 0 30px;
            ">
            <img loading="lazy" alt="" src="@/assets/login/hi.png" style="width: 34px; height: 34px" />
            <div class="login-text">{{ $t("login.title") }}</div>

            <div class="login-welcome">
              {{ $t("login.welcome") }}
            </div>

            <!-- 语言切换下拉菜单 -->
            <el-dropdown trigger="click" class="title-language-dropdown"
              @visible-change="handleLanguageDropdownVisibleChange">
              <span class="el-dropdown-link">
                <span class="current-language-text">{{ currentLanguageText }}</span>
                <i class="el-icon-arrow-down el-icon--right" :class="{ 'rotate-down': languageDropdownVisible }"></i>
              </span>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item @click.native="changeLanguage('en')">
                  {{ $t("language.en") || "English" }}
                </el-dropdown-item>
                <el-dropdown-item @click.native="changeLanguage('fr')">
                  {{ $t("language.fr") || "Français" }}
                </el-dropdown-item>
                <el-dropdown-item @click.native="changeLanguage('ar')">
                  {{ $t("language.ar") || "العربية" }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
          <div style="padding: 0 30px">
            <!-- 用户名登录 -->
            <template v-if="!isMobileLogin">
              <div class="input-box">
                <img loading="lazy" alt="" class="input-icon" src="@/assets/login/username.png" />
                <el-input v-model="form.username" :placeholder="$t('login.usernamePlaceholder')" />
              </div>
            </template>

            <!-- 手机号登录 -->
            <template v-else>
              <div class="input-box">
                <div style="display: flex; align-items: center; width: 100%">
                  <el-select v-model="form.areaCode" style="width: 220px; margin-right: 10px">
                    <el-option v-for="item in mobileAreaList" :key="item.key" :label="`${item.name} (${item.key})`"
                      :value="item.key" />
                  </el-select>
                  <el-input v-model="form.mobile" :placeholder="$t('login.mobilePlaceholder')" />
                </div>
              </div>
            </template>

            <div class="input-box">
              <img loading="lazy" alt="" class="input-icon" src="@/assets/login/password.png" />
              <el-input v-model="form.password" :placeholder="$t('login.passwordPlaceholder')" type="password"
                show-password />
            </div>
            <!-- Captcha field hidden - auto-generated -->
            <div style="
                font-weight: 400;
                font-size: 14px;
                text-align: left;
                color: #5778ff;
                display: flex;
                justify-content: space-between;
                margin-top: 20px;
              ">
              <div v-if="allowUserRegister" style="cursor: pointer" @click="goToRegister">
                {{ $t("login.register") }}
              </div>
              <div style="cursor: pointer" @click="goToForgetPassword" v-if="enableMobileRegister">
                {{ $t("login.forgetPassword") }}
              </div>
            </div>
          </div>
          <div class="login-btn" @click="login">{{ $t("login.login") }}</div>

          <!-- 登录方式切换按钮 -->
          <div class="login-type-container" v-if="enableMobileRegister">
            <div style="display: flex; gap: 10px">
              <el-tooltip :content="$t('login.mobileLogin')" placement="bottom">
                <el-button :type="isMobileLogin ? 'primary' : 'default'" icon="el-icon-mobile" circle
                  @click="switchLoginType('mobile')"></el-button>
              </el-tooltip>
              <el-tooltip :content="$t('login.usernameLogin')" placement="bottom">
                <el-button :type="!isMobileLogin ? 'primary' : 'default'" icon="el-icon-user" circle
                  @click="switchLoginType('username')"></el-button>
              </el-tooltip>
            </div>
          </div>
          <div style="font-size: 14px; color: #979db1">
            {{ $t("login.agreeTo") }}
            <div style="display: inline-block; color: #5778ff; cursor: pointer" @click="openPage('/user-agreement.html')">
              {{ $t("login.userAgreement") }}
            </div>
            {{ $t("login.and") }}
            <div style="display: inline-block; color: #5778ff; cursor: pointer" @click="openPage('/privacy-policy.html')">
              {{ $t("login.privacyPolicy") }}
            </div>
          </div>
        </div>
      </el-main>
      <el-footer>
        <version-footer />
      </el-footer>
    </el-container>
  </div>
</template>

<script>
import Api from "@/apis/api";
import VersionFooter from "@/components/VersionFooter.vue";
import i18n, { changeLanguage } from "@/i18n";
import { getUUID, goToPage, showDanger, showSuccess, sm2Encrypt, validateMobile } from "@/utils";
import { mapState } from "vuex";
import featureManager from "@/utils/featureManager";

export default {
  name: "login",
  components: {
    VersionFooter,
  },
  computed: {
    ...mapState({
      allowUserRegister: (state) => state.pubConfig.allowUserRegister,
      enableMobileRegister: (state) => state.pubConfig.enableMobileRegister,
      mobileAreaList: (state) => state.pubConfig.mobileAreaList,
      sm2PublicKey: (state) => state.pubConfig.sm2PublicKey,
    }),
    // 获取当前语言
    currentLanguage() {
      return i18n.locale || "en";
    },
    // 获取当前语言显示文本
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
    // 根据当前语言获取对应的xiaozhi-ai图标
    xiaozhiAiIcon() {
      return require("@/assets/xiaozhi-ai_en.png");
    },
  },
  data() {
    return {
      activeName: "username",
      form: {
        username: "",
        password: "",
        captcha: "",
        captchaId: "",
        areaCode: "+86",
        mobile: "",
      },
      captchaUuid: "",
      captchaUrl: "",
      isMobileLogin: false,
      languageDropdownVisible: false,
    };
  },
  mounted() {
    this.fetchCaptcha();
    this.$store.dispatch("fetchPubConfig").then(() => {
      // 根据配置决定默认登录方式
      this.isMobileLogin = this.enableMobileRegister;
    });
  },
  methods: {
    openPage(url) {
      const lang = this.$i18n ? this.$i18n.locale : 'zh_CN';
      if (!lang.startsWith('zh')) {
        url = url.replace('.html', '-en.html');
      }
      window.open(url, '_blank');
    },
    fetchCaptcha() {
      // Captcha validation disabled - auto-generate random value
      const token = localStorage.getItem('token')
      if (token) {
        if (this.$route.path !== "/home") {
          this.$router.push("/home");
        }
      } else {
        this.captchaUuid = getUUID();
        // Auto-generate a random 5-char captcha (validation bypassed on backend)
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let randomCaptcha = '';
        for (let i = 0; i < 5; i++) {
          randomCaptcha += chars[Math.floor(Math.random() * chars.length)];
        }
        this.form.captcha = randomCaptcha;
      }
    },

    // 切换语言下拉菜单的可见状态变化
    handleLanguageDropdownVisibleChange(visible) {
      this.languageDropdownVisible = visible;
    },

    // 切换语言
    changeLanguage(lang) {
      changeLanguage(lang);
      this.languageDropdownVisible = false;
      this.$message.success({
        message: this.$t("message.success"),
        showClose: true,
      });
    },

    // 切换登录方式
    switchLoginType(type) {
      this.isMobileLogin = type === "mobile";
      // 清空表单
      this.form.username = "";
      this.form.mobile = "";
      this.form.password = "";
      this.form.captcha = "";
      this.fetchCaptcha();
    },

    // 封装输入验证逻辑
    validateInput(input, messageKey) {
      if (!input.trim()) {
        showDanger(this.$t(messageKey));
        return false;
      }
      return true;
    },
    
    getUserInfo() {
      Api.user.getUserInfo(({ data }) => {
        if (data.code === 0) {
          this.$store.commit("setUserInfo", data.data);
          goToPage("/home");
        } else {
          showDanger("用户信息获取失败");
        }
      });
    },

    async login() {
      if (this.isMobileLogin) {
        // 手机号登录验证
        if (!validateMobile(this.form.mobile, this.form.areaCode)) {
          showDanger(this.$t('login.requiredMobile'));
          return;
        }
        // 拼接手机号作为用户名
        this.form.username = this.form.areaCode + this.form.mobile;
      } else {
        // 用户名登录验证
        if (!this.validateInput(this.form.username, 'login.requiredUsername')) {
          return;
        }
      }

      // 验证密码
      if (!this.validateInput(this.form.password, 'login.requiredPassword')) {
        return;
      }
      // Captcha validation disabled
      // 加密密码
      let encryptedPassword;
      try {
        // 拼接验证码和密码
        const captchaAndPassword = this.form.captcha + this.form.password;
        encryptedPassword = sm2Encrypt(this.sm2PublicKey, captchaAndPassword);
      } catch (error) {
        console.error("密码加密失败:", error);
        showDanger(this.$t('sm2.encryptionFailed'));
        return;
      }

      const plainUsername = this.form.username;

      this.form.captchaId = this.captchaUuid;

      // 加密
      const loginData = {
        username: plainUsername,
        password: encryptedPassword,
        captchaId: this.form.captchaId
      };

      Api.user.login(
        loginData,
        ({ data }) => {
          showSuccess(this.$t('login.loginSuccess'));
          this.$store.commit("setToken", JSON.stringify(data.data));
          this.getUserInfo();
        },
        (err) => {
          // 直接使用后端返回的国际化消息
          let errorMessage = err.data.msg || "登录失败";

          showDanger(errorMessage);
        }
      );

      // 重新获取验证码
      setTimeout(() => {
        this.fetchCaptcha();
      }, 1000);
    },

    goToRegister() {
      goToPage("/register");
    },
    goToForgetPassword() {
      goToPage("/retrieve-password");
    }
  },
};
</script>
<style lang="scss" scoped>
@import "./auth.scss";

.login-type-container {
  margin: 10px 20px;
  display: flex;
  justify-content: center;
}

.title-language-dropdown {
  margin-left: auto;
}

.current-language-text {
  margin-left: 4px;
  margin-right: 4px;
  font-size: 12px;
  color: #3d4566;
}

.language-dropdown {
  margin-left: auto;
}

.rotate-down {
  transform: rotate(180deg);
  transition: transform 0.3s ease;
}

.el-icon-arrow-down {
  transition: transform 0.3s ease;
}

:deep(.el-button--primary) {
  background-color: #5778ff;
  border-color: #5778ff;

  &:hover,
  &:focus {
    background-color: #4a6ae8;
    border-color: #4a6ae8;
  }

  &:active {
    background-color: #3d5cd6;
    border-color: #3d5cd6;
  }
}
</style>
