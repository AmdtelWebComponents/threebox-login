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
      threeLibraryLoaded: { type: Boolean },
      authenticated: { type: Boolean },
      authenticating: { type: Boolean}
    }
  }

  constructor() {
    super();
    this.threeLibraryLoaded = false;
  }

  firstUpdated() {
    // On initial load check if the browser is web3 enabled.
    // true: Check if the selected ether addr has a 3box profile.
    if (window.ethereum || window.web3) {
      let ethProvider = window['ethereum'] || window.web3.currentProvider;
      if (ethProvider.selectedAddress) {
        this.ethAddress = ethProvider.selectedAddress;
        this._loadThreeLibrary();
      };
    } else {
      console.log('No web3! You will need to install MetaMask!')
    }
  }

  async _enableEthereum() {
    try {
      const accounts = await window.ethereum.send('eth_requestAccounts');
      this.ethAddress = accounts.result[0];
      this._loadThreeLibrary();
    } catch (error) {
      console.log(error)
    }
  }
  _loadThreeLibrary() {
    if (!this.threeLibraryLoaded) {
      let script = document.createElement('script');
      script.onload = () => {this.threeLibraryLoaded=true;this._getProfile()}
      script.src = 'https://unpkg.com/3box/dist/3box.min.js';
      let firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(script, firstScriptTag);
    } else {
      this._getProfile();
    }
  }
  async _getProfile() {
    // retrieve users 3box profile.
    // if ether addr is changed (todo: also need to listen for network change) for now just reload page as a reset
    try {
      window.ethereum.on('accountsChanged', function(accounts) {
        window.location.reload();
      })
      let profile = await window.Box.getProfile(this.ethAddress);
      // if we have a profile check if they are logged in and authenticate.
      // else leave option to login
      if (Object.keys(profile).length !== 0) {
        this.authenticated = window.Box.isLoggedIn(this.ethAddress);
        this.threeProfile = profile;
        this.authenticated && this._authenticate(this.ethAddress)
      } 
    } catch (error) {
      console.log(error)
    }
  }
  async _authenticate() {
    this.authenticated = false;
    this.authenticating = true;
    let provider = window.ethereum
    window.box = await Box.openBox(this.ethAddress, provider);
    await box.syncDone
    this.authenticated = true;
    this.authenticating = false;
  }
  async _logout() {
    await window.box.logout()
    this.authenticated = false;
  }

  render() {
    if(this.authenticated) {
      return html`
        <p>Name: ${this.threeProfile.name}</p>
        <img src="${"https://ipfs.infura.io/ipfs/" + this.threeProfile.coverPhoto[0].contentUrl["/"]}" alt="profile"/>
        <br/>
        <button @click="${this._logout}">Logout</button>`
    }
    else if(this.authenticating) {
      return html`<h3>Logging in...</h3>`
    }
    else if(this.threeProfile) {
      return html`
        <p>Name: ${this.threeProfile.name}</p>
        <img src="${"https://ipfs.infura.io/ipfs/" + this.threeProfile.coverPhoto[0].contentUrl["/"]}" alt="profile"/>
        <br/>
        <button @click="${this._authenticate}">Login 3box</button>`
    }
    else if(this.ethAddress) {
      return html`<button @click="${this._authenticate}">Create 3box</button>`
    }
    else {
      return html`<button @click="${this._enableEthereum}">Login Ethereum</button>`;
    }
  }
}
