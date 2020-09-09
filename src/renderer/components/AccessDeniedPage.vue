<template>
  <div class="wrapper">
    <div class="wrapper-label" v-if="hasRFCxRole === false">You don't have required permissions to access this app. Ask admin@rfcx.org for details.</div>
    <div class="wrapper__terms-form" v-if="consentGiven === false">
      <input type="checkbox" id="terms-checkbox" v-model="acceptTermsChecked">
      <span>
        <label for="terms-checkbox">I have read and agree with</label> <a v-on:click="openTermsAndConditions()">Terms and Conditions</a>
      </span>
      <div class="wrapper__btn-wrapper">
        <button class="button is-primary is-rounded" :class="{ 'is-loading': isLoading }" :disabled="!acceptTermsChecked || isLoading || showSuccessMessage" v-if="hasRFCxRole === true" @click="sendAcceptTerms()">Submit</button>
      </div>
      <div v-if="hasRFCxRole === true && errorMessage">
        <p class="wrapper__error-message">{{errorMessage}}</p>
      </div>
      <p class="wrapper__success-message" v-if="hasRFCxRole === true && showSuccessMessage">
        <span>Redirecting to homepage...</span>
      </p>
    </div>
    <div class="wrapper__user-code" v-if="hasAccessToSendCode && hasRFCxRole === false">
      <p class="wrapper__user-code-label">Have an invite code? Paste is here:</p>
      <fieldset>
        <div class="wrapper__access-form">
          <div class="field has-addons">
            <div class="control is-expanded">
              <input id="userCode" v-model="code" class="input" type="text" name="code" placeholder="Code" :disabled="isLoading || showSuccessMessage" required>
            </div>
            <div class="control">
              <button class="button is-primary" :class="{ 'is-loading': isLoading }" :disabled="!isFormValid || isLoading || showSuccessMessage || !acceptTermsChecked" @click.prevent="sendRequest">Send</button>
            </div>
          </div>
          <div v-if="errorMessage">
            <p class="wrapper__error-message">{{errorMessage}}</p>
          </div>
        </div>
      </fieldset>
      <p class="wrapper__success-message" v-if="showSuccessMessage">
        <span>You have got access. Please, wait a moment.</span>
      </p>
    </div>
    <a class="button is-default wrapper__logout-btn is-rounded" @click="logOut()">Log out</a>
  </div>
</template>

<script>
  import api from '../../../utils/api'
  import settings from 'electron-settings'
  const { remote } = window.require('electron')

  export default {
    name: 'access-denied-page',
    data () {
      return {
        code: '',
        showSuccessMessage: false,
        errorMessage: '',
        isLoading: false,
        hasAccessToSendCode: false,
        roles: null,
        hasRFCxRole: null,
        consentGiven: null,
        acceptTermsChecked: false
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
        if (!this.acceptTermsChecked) {
          return
        }
        let listen = (event, arg) => {
          this.$electron.ipcRenderer.removeListener('sendRefreshToken', listen)
          this.$router.push('/')
        }
        let listener = (event, arg) => {
          this.$electron.ipcRenderer.removeListener('sendIdToken', listener)
          let idToken = null
          idToken = arg
          let payload = {
            code: this.code,
            acceptTerms: this.acceptTermsChecked
          }
          return api.sendInviteCode(this.isProductionEnv(), payload, idToken).then((data) => {
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
      },
      sendAcceptTerms () {
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
          return api.sendAcceptTerms(this.isProductionEnv(), idToken).then((data) => {
            this.isLoading = false
            console.log('\n\ndata', data, '\n\n')
            if (data.success === true) {
              this.$electron.ipcRenderer.send('getRefreshToken')
              this.$electron.ipcRenderer.on('sendRefreshToken', listen)
              this.showSuccessMessage = true
            } else {
              this.errorMessage = 'Unable to process your request.'
            }
          }).catch((err) => {
            this.isLoading = false
            console.log('error', err)
            this.errorMessage = 'Unable to process your request.'
          })
        }
        this.$electron.ipcRenderer.send('getIdToken')
        this.$electron.ipcRenderer.on('sendIdToken', listener)
      },
      openTermsAndConditions () {
        this.$electron.shell.openExternal('https://rfcx.org/terms-of-service')
      }
    },
    computed: {
      isFormValid: function () {
        return !!this.code && !!this.code.length
      }
    },
    created () {
      console.log('Access-denied page created')
      this.roles = remote.getGlobal('roles') || []
      this.hasRFCxRole = this.roles.includes('rfcxUser')
      this.consentGiven = remote.getGlobal('consentGiven') || false
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

<style lang="scss" scoped>
  .wrapper {
    padding-top: 150px;
    text-align: center;
    margin: 0;
    position: relative;
    &__logout-btn {
      margin-top: $default-padding-margin;
    }
    &__terms-form {
      input,
      span,
      label,
      a {
        display: inline-block;
        vertical-align: middle;
        font-size: 14px;
        line-height: 1;
      }
      label {
        cursor: pointer;
      }
      a:hover {
        color: #2FB04A;
      }
    }
    &__btn-wrapper {
      margin-top: $default-padding-margin;
    }
    &__label {
      width: 90%;
      text-align: center;
      font-size: 22px;
      font-weight: 300;
      line-height: 4.8rem;
      color: grey;
      margin: 0 auto;
      color: #fff;
    }
    &__user-code {
      text-align: center;
      margin-top: 20px;
    }
    &__user-code-label {
      width: 90%;
      text-align: center;
      font-size: 14px;
      color: grey;
      margin: 0 auto 5px;
      color: #fff;
    }
    &__success-message {
      margin-top: 1rem;
      width: 90%;
      margin: 1rem auto 0;
      font-size: 14px;
    }
    &__error-message {
      text-align: center;
      font-size: 14px;
      color: $danger-color;
    }
    &__access-form {
      width: 90%;
      max-width: 350px;
      margin: 0 auto;
    }
  }
</style>
