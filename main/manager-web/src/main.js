import { translateBackendText } from './utils/translateBackendText';
import 'element-ui/lib/theme-chalk/index.css';
import 'normalize.css/normalize.css'; // A modern alternative to CSS resets
import Vue from 'vue';
import ElementUI from 'element-ui';
import App from './App.vue';
import router from './router';
import store from './store';
import i18n from './i18n';
import locale from 'element-ui/lib/locale'
import './styles/global.scss';
import { register as registerServiceWorker } from './registerServiceWorker';
import featureManager from './utils/featureManager';

// [text]，[text]
Vue.prototype.$eventBus = new Vue();

Vue.prototype.$tBackend = translateBackendText;
Vue.filter('translateBackend', translateBackendText);
Vue.use(ElementUI);
locale.i18n((key, value) => i18n.t(key, value))

Vue.config.productionTip = false

// [text]Service Worker
registerServiceWorker();

// [text]Vue[text]
new Vue({
  router,
  store,
  i18n,
  render: function (h) { return h(App) }
}).$mount('#app')
