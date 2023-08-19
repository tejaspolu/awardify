const REDIRECT_URI = "http://127.0.0.1:5500/redirect.html";
const SCOPE = 'user-top-read';
const AUTHORIZE = "https://accounts.spotify.com/authorize";
const TOKEN = "https://accounts.spotify.com/api/token";

var client_id = "61306c8268a04a0dbbed3fc83dac6d2e";
var client_secret = "5fc33a1630e84da5b25574f1ab64e53b";
var access_token = null;
var refresh_token = null;


function generateRandomString(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function generateCodeChallenge(codeVerifier) {
    function base64encode(string) {
      return btoa(String.fromCharCode.apply(null, new Uint8Array(string)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    }
  
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return base64encode(digest);
}

function refreshAccessToken(){
    refresh_token = localStorage.getItem("refresh_token");
    let body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refresh_token,
        client_id: client_id,
    });

    const response = fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body
    })
    .then(response => {
        if (!response.ok) {
        throw new Error('HTTP status ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem("refresh_token", refresh_token);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function requestAuthorization() {
    let codeVerifier = generateRandomString(128);

    generateCodeChallenge(codeVerifier).then(codeChallenge => {
    let state = generateRandomString(16);

    localStorage.setItem('code_verifier', codeVerifier);

    let args = new URLSearchParams({
        response_type: 'code',
        client_id: client_id,
        scope: SCOPE,
        redirect_uri: REDIRECT_URI,
        state: state,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge
    });

    window.location = 'https://accounts.spotify.com/authorize?' + args;
    });
}

function onPageLoad() {
    if(window.location.search.length > 0 ){
        handleRedirect();
        loadArtists();
    }
}

function loadArtists() {
    callApi("GET", "https://api.spotify.com/v1/me/top/artists?limit=5&offset=0", null, handleArtistsResponses)
}

function callApi(method, url, body, callback){
    let xhr = new XMLHttpRequest();
    let access_token = localStorage.getItem('access_token');
    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
    xhr.send(body);
    xhr.onload = callback;
}

function handleArtistsResponses() {
    if (this.status == 200){
        var data = JSON.parse(this.responseText);
        console.log(data.items);
        //data.artists.forEach(item => addDevice(item));
    }
    else if (this.status == 401){
        refreshAccessToken();
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function handleRedirect() {
    let code = getCode();
    getAccessToken(code);
    window.history.pushState("", "", REDIRECT_URI);
}

function getAccessToken(code) {
    let codeVerifier = localStorage.getItem('code_verifier');
    let body = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        client_id: client_id,
        code_verifier: codeVerifier
    });

    const response = fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body
    })
    .then(response => {
        if (!response.ok) {
        throw new Error('HTTP status ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem("refresh_token", refresh_token);
    })
    .catch(error => {
        console.error('Error:', error);
    });
    
    // let str = "grant_type=authorization_code";
    // str += "&code=" + code; 
    // str += "&redirect_uri=" + encodeURI(REDIRECT_URI);
    // str += "&client_id=" + client_id;
    // str += "&client_secret=" + client_secret;
    // callAuthorizationApi(str);
}


function getCode() {
    let code = null; 
    if(window.location.search.length > 0){
        const urlParams = new URLSearchParams(window.location.search);
        code = urlParams.get('code');
    }
    return code;
}


// function callAuthorizationApi(str){
//     let xhr = new XMLHttpRequest();
//     xhr.open("POST", TOKEN, true);
//     xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
//     xhr.setRequestHeader('Authorization', 'Basic ' + btoa(client_id + ":" + client_secret));
//     xhr.send(str);
//     xhr.onload = handleAuthResponse;
// }

// function handleAuthResponse() {
//     if (this.status == 200){
//         var data = JSON.parse(this.responseText);
//         console.log(data);
//         if (data.access_token != undefined){
//             access_token = data.access_token;
//             localStorage.setItem("access_token", access_token);
//         }
//         if (data.refresh_token != undefined){
//             refresh_token = data.refresh_token;
//             localStorage.setItem("refresh_token", refresh_token);
//         }
//         onPageLoad();
//     }
//     else {
//         console.log(this.responseText);
//         alert(this.responseText);
//     }
// }

// function requestAuthorization() {
//     let url = `https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=${SCOPE}`;
//     window.location.href = url;
    
// }

// function generateRandomString(length) {
//     let text = '';
//     let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
//     for (let i = 0; i < length; i++) {
//       text += possible.charAt(Math.floor(Math.random() * possible.length));
//     }
//     return text;
//   }





// const APIController = (function() {
    // const clientId = "61306c8268a04a0dbbed3fc83dac6d2e";
    // const clientSecret = "5fc33a1630e84da5b25574f1ab64e53b";
    // const redirectURi = "http://127.0.0.1:5500/index.html/callback";
//     const scope =  'user-top-read';

//     const _verifyUser  = async() => {
//         window.location.href = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectURi}&scope=${scope}`;
//         console.log("Yoooo");
//     }

//     const _getToken = async() => {

//         //sending a POST request and getting token from spotify
//         const result = await fetch('https://accounts.spotify.com/api/token', {
//             method: 'POST',
//             headers: {
//                 'Content-Type' : 'application/x-www-form-urlencoded',
//                 'Authorization' : 'Basic' + btoa(clientId + ':' + clientSecret)
//             },
//             body: 'grant_type=client_credentials'
//         });

//         console.log("RESULT" + result.status.toString());
//         //converting the result to json and specifically returning the access token
//         const data = await result.json();
//         console.log("Hi" + data.access_token);
//         return data.access_token;
//     }

    // const _getTopArtists = async(token) => {
    //     const limit = 5;
    //     const result = await fetch(`https://api.spotify.com/v1/me/top/artists?limit=5${limit}&offset=0`, {
    //         method: 'GET',
    //         headers: {'Authorization' : 'Bearer' + token}
    //     })
    //     const data = await result.json();
    //     return data.artists;
    // }

//     //making public methods
//     return {
//         verifyUser() {
//             return _verifyUser();
//         },
//         getToken() {
//             return _getToken();
//         },
//         getTopArtists() {
//             return _getTopArtists(token);
//         }
//     }
// })();

// const UIController = (function() {})();

// const APPController = (function(UICtrl, APICtrl) {

//     const loadGenres = async () => {
//         //get the token
//         const token = await APICtrl.getToken();           
//         console.log("Bye" + token);
//     }

//     return {
//         init() {
//             console.log('App is starting');
//             loadGenres();
//         }
//     }
// })(UIController, APIController);

// APPController.init();

