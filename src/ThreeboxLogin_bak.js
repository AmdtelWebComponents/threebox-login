import { html, css, LitElement } from 'lit-element';

export class ThreeboxLogin extends LitElement {
  static get styles() {
    return css`
      :host {
        --threebox-login-text-color: #000;

        display: block;
        padding: 25px;
        color: var(--threebox-login-text-color);
      }
    `;
  }

  static get properties() {
    return {
      ethAddress: { type: String },
      threeProfile: { type: Object },
      authenticated: { type: Boolean },
      authenticating: { type: Boolean}
    }
  }

  async _enableEthereum() {
    try {
      let accounts = await window.ethereum.enable();
      this._getProfile(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }
  async _getProfile(ethAddress) {
    try {
      window.ethereum.on('accountsChanged', function(accounts) {
        window.location.reload();
      })
      let profile = await window.Box.getProfile(ethAddress);
      if (Object.keys(profile).length !== 0) {
        this.authenticated = window.Box.isLoggedIn(ethAddress);
        this.threeProfile = profile;
        this.authenticated && this._authenticate(ethAddress)
      } 
    } catch (error) {
      console.log(error)
    }
  }
  async _authenticate(ethAddress) {
    this.authenticated = false;
    this.authenticating = true;
    window.box = await window.Box.openBox(ethAddress, window.ethereum);
    await box.syncDone
    this.authenticated = true;
    this.authenticating = false;
  }
  async _logout() {
    await window.box.logout()
    this.authenticated = false;
  }

  render() {
    return html`<button @click="${this._authenticate}">Create 3box</button>`
  }
}
