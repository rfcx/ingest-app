<template>
  <div id="wrapper-access-denied-page" class="access-denied-page" :class="{ 'dark-mode': isDark }">
    <div class="access-denied-page-label">You don't have required permissions to access this app. Ask admin@rfcx.org for details.</div>
    <div class="access-denied-page-btn">
      <a class="button is-primary" @click="logOut()">Log out</a>
    </div>
    <div class="user-code" v-if="hasAccessToSendCode">
      <p class="user-code-label">Have an invite code? Paste is here:</p>
      <fieldset>
        <div class="form">
          <div class="field has-addons">
            <div class="control is-expanded">
              <input id="userCode" v-model="code" class="input" type="text" name="code" placeholder="Code" :disabled="isLoading || showSuccessMessage" required>
            </div>
            <div class="control">
              <button class="button is-primary" :class="{ 'is-loading': isLoading }" :disabled="!isFormValid || isLoading || showSuccessMessage" @click.prevent="sendRequest">Send</button>
            </div>
          </div>
          <div v-if="errorMessage">
            <p class="error-message">{{errorMessage}}</p>
          </div>
        </div>
      </fieldset>
      <p class="success-message" v-if="showSuccessMessage">
        <span>You have got access.</span>
      </p>
    </div>
  </div>
</template>

<script>
  import api from '../../../utils/api'
  import settings from 'electron-settings'

  export default {
    name: 'access-denied-page',
    data () {
      return {
        code: '',
        showSuccessMessage: false,
        errorMessage: '',
        isLoading: false,
        hasAccessToSendCode: false,
        isDark: null,
        darkThemeForm: settings.watch('settings.darkMode', (newValue, oldValue) => {
          this.isDark = newValue
          console.log('isDarkTheme', this.isDark)
        })
      }
    },
    methods: {
      logOut () {
        console.log('Log out')
        this.$electron.ipcRenderer.send('logOut')
      },
      isProductionEnv () {
        return settings.get('settings.production_env')
      },
      sendRequest () {
        this.showSuccessMessage = false
        this.errorMessage = null
        this.isLoading = true
        let listen = (event, arg) => {
          this.$electron.ipcRenderer.removeListener('sendRefreshToken', listen)
          this.$router.push('/')
        }
        let listener = (event, arg) => {
          this.$electron.ipcRenderer.removeListener('sendIdToken', listener)
          let idToken = null
          idToken = arg
          return api.sendInviteCode(this.isProductionEnv(), this.code, idToken).then((data) => {
            this.isLoading = false
            if (data.success === true) {
              this.$electron.ipcRenderer.send('getRefreshToken')
              this.$electron.ipcRenderer.on('sendRefreshToken', listen)
              this.showSuccessMessage = true
            } else {
              this.errorMessage = 'Invalid code.'
            }
          }).catch((err) => {
            this.isLoading = false
            console.log('error', err)
            this.errorMessage = 'Invalid code.'
          })
        }
        this.$electron.ipcRenderer.send('getIdToken')
        this.$electron.ipcRenderer.on('sendIdToken', listener)
      }
    },
    computed: {
      isFormValid: function () {
        return !!this.code && !!this.code.length
      }
    },
    created () {
      console.log('Access-denied page created')
      this.isDark = settings.get('settings.darkMode')
      let html = document.getElementsByTagName('html')[0]
      if (html && this.isDark) {
        html.style.backgroundColor = '#131525'
      }
      let listener = (event, arg) => {
        this.$electron.ipcRenderer.removeListener('sendIdToken', listener)
        let idToken = null
        idToken = arg
        return api.touchApi(this.isProductionEnv(), idToken).then(data => {
          this.hasAccessToSendCode = true
        }).catch(error => {
          console.log('error', error)
          this.hasAccessToSendCode = false
        })
      }
      this.$electron.ipcRenderer.send('getIdToken')
      this.$electron.ipcRenderer.on('sendIdToken', listener)
    }
  }
</script>

<style lang="scss">

  .access-denied-page {
    padding-top: 150px;
    text-align: center;
    margin: 0;
  }

  .access-denied-page-label {
    width: 90%;
    text-align: center;
    font-size: 22px;
    font-weight: 300;
    line-height: 4.8rem;
    color: grey;
    margin: 0 auto;
  }

  .access-denied-page-btn {
    margin-top: 20px;
  }

  .user-code {
   text-align: center;
   margin-top: 40px;
  }

  .user-code-label {
    width: 90%;
    text-align: center;
    font-size: 14px;
    color: grey;
    margin: 0 auto;
  }

  .form {
    width: 90%;
    max-width: 350px;
    margin: 0 auto;
  }

  .error-message {
    text-align: right;
    font-size: 14px;
  }

  .success-message {
    margin-top: 1rem;
    width: 90%;
    margin: 1rem auto 0;
    font-size: 14px;
  }

  .button_small {
    margin: 0 3px;
  }

  .dark-mode {
    background-color: #131525 !important;
    color: #fff !important;
    overflow: auto !important;
  }

</style>
