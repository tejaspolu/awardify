//const REDIRECT_URI = "http://127.0.0.1:5500/home.html";
//const INDEX_URI = "http://127.0.0.1:5500/index.html";
const REDIRECT_URI = "https://awardify.vercel.app/home.html";
const INDEX_URI = "https://awardify.vercel.app/index.html";
const SCOPE = 'user-top-read';
const AUTHORIZE = "https://accounts.spotify.com/authorize";
const TOKEN = "https://accounts.spotify.com/api/token";

var client_id = "61306c8268a04a0dbbed3fc83dac6d2e";
var client_secret = "5fc33a1630e84da5b25574f1ab64e53b";
var access_token = null;
var refresh_token = null;
var awardType = 'artist';


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
    if(window.location.href.includes('index.html')){
        handleRedirect();
        loadArtists();
    }
}

function loadData(time_range, dataType) {
    const artistButton = document.querySelector('#artist-btn');
    const songButton = document.querySelector('#song-btn');
    if(artistButton.classList.contains('underline')) {
        callApi("GET", `https://api.spotify.com/v1/me/top/artists?time_range=${time_range}&limit=5&offset=0`, null, handleArtistsResponses);
    }
    if(songButton.classList.contains('underline')) {
        callApi("GET", `https://api.spotify.com/v1/me/top/tracks?time_range=${time_range}&limit=5&offset=0`, null, handleSongsResponses);
    }
}

function loadArtists() {
    const artistButton = document.querySelector('#artist-btn');
    const imageContainer = document.querySelector('.data-container');
    var timeRange = null;
    if(document.querySelector('.btn-weeks').classList.contains('underline')) timeRange = 'short_term';
    if(document.querySelector('.btn-months').classList.contains('underline')) timeRange = 'medium_term';
    if(document.querySelector('.btn-years').classList.contains('underline')) timeRange = 'long_term';
    
    if((artistButton.classList.contains('underline') & imageContainer.children.length == 0) || artistButton.classList.contains('no-underline')){
        callApi("GET", `https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=5&offset=0`, null, handleArtistsResponses);
    }
}

function loadSongs() {
    const songButton = document.querySelector('#song-btn');
    const imageContainer = document.querySelector('.data-container');
    var timeRange = null;
    if(document.querySelector('.btn-weeks').classList.contains('underline')) timeRange = 'short_term';
    if(document.querySelector('.btn-months').classList.contains('underline')) timeRange = 'medium_term';
    if(document.querySelector('.btn-years').classList.contains('underline')) timeRange = 'long_term';
    
    if((songButton.classList.contains('underline') & imageContainer.children.length == 0) || songButton.classList.contains('no-underline')){
        callApi("GET", `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=5&offset=0`, null, handleSongsResponses);
    }
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
        handleArtistDOM(data);
    }
    else if (this.status == 401){
        refreshAccessToken();
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function handleSongsResponses() {
    if (this.status == 200){
        var data = JSON.parse(this.responseText);
        handleSongDOM(data);
    }
    else if (this.status == 401){
        refreshAccessToken();
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function handleSongDOM(data) {
    const imageContainer = document.querySelector('.data-container');
    if(imageContainer.children.length > 0) {
        while (imageContainer.firstChild) {
            imageContainer.removeChild(imageContainer.lastChild);
        }
    }

    const songContainer = document.createElement("div");
    const otherSongsContainer = document.createElement("div");

    imageContainer.appendChild(songContainer);
    imageContainer.appendChild(otherSongsContainer);

    const songImage = document.createElement("img");
    songImage.src = data.items[0].album.images[0].url;
    songImage.style.width = songContainer.offsetHeight+ "px";
    songImage.style.height = songContainer.offsetHeight+ "px";
    songContainer.appendChild(songImage);
    
    const awardContainer = document.createElement('div');
    awardContainer.classList.add('award-container');
    const awardTitle = document.createTextNode("Top Song:");
    const awardWinner = document.createTextNode(data.items[0].name);
    const awardTitleText = document.createElement('p');
    const awardTitleWinner = document.createElement('p');
    awardTitleText.appendChild(awardTitle);
    awardTitleWinner.appendChild(awardWinner);
    awardContainer.appendChild(awardTitleText);
    awardContainer.appendChild(awardTitleWinner);
    songContainer.appendChild(awardContainer);

    const songImage2 = document.createElement("img");
    songImage2.src = data.items[1].album.images[0].url;
    songImage2.style.width = (otherSongsContainer.offsetHeight / 2)+ "px";
    songImage2.style.height = (otherSongsContainer.offsetHeight / 2)+ "px";

    const songImage3 = document.createElement("img");
    songImage3.src = data.items[2].album.images[0].url;
    songImage3.style.width = (otherSongsContainer.offsetHeight / 2)+ "px";
    songImage3.style.height = (otherSongsContainer.offsetHeight / 2)+ "px";

    const songImage4 = document.createElement("img");
    songImage4.src = data.items[3].album.images[0].url;
    songImage4.style.width = (otherSongsContainer.offsetHeight / 2)+ "px";
    songImage4.style.height = (otherSongsContainer.offsetHeight / 2)+ "px";

    const songImage5 = document.createElement("img");
    songImage5.src = data.items[4].album.images[0].url;
    songImage5.style.width = (otherSongsContainer.offsetHeight / 2)+ "px";
    songImage5.style.height = (otherSongsContainer.offsetHeight / 2)+ "px";
    
    otherSongsContainer.appendChild(songImage2);
    otherSongsContainer.appendChild(songImage3);
    otherSongsContainer.appendChild(songImage4);
    otherSongsContainer.appendChild(songImage5);
}

function handleArtistDOM(data) {
    const imageContainer = document.querySelector('.data-container');
    if(imageContainer.children.length > 0) {
        while (imageContainer.firstChild) {
            imageContainer.removeChild(imageContainer.lastChild);
        }
    }

    const artistContainer = document.createElement("div");
    const otherArtistsContainer = document.createElement("div");

    imageContainer.appendChild(artistContainer);
    imageContainer.appendChild(otherArtistsContainer);

    const artistImage = document.createElement("img");
    artistImage.src = data.items[0].images[0].url;
    artistImage.style.width = artistContainer.offsetHeight+ "px";
    artistImage.style.height = artistContainer.offsetHeight+ "px";
    artistContainer.appendChild(artistImage);
    
    const awardContainer = document.createElement('div');
    awardContainer.classList.add('award-container');
    const awardTitle = document.createTextNode("Top Artist:");
    const awardWinner = document.createTextNode(data.items[0].name);
    const awardTitleText = document.createElement('p');
    const awardTitleWinner = document.createElement('p');
    awardTitleText.appendChild(awardTitle);
    awardTitleWinner.appendChild(awardWinner);
    awardContainer.appendChild(awardTitleText);
    awardContainer.appendChild(awardTitleWinner);
    artistContainer.appendChild(awardContainer);

    const artistImage2 = document.createElement("img");
    artistImage2.src = data.items[1].images[0].url;
    artistImage2.style.width = (otherArtistsContainer.offsetHeight / 2)+ "px";
    artistImage2.style.height = (otherArtistsContainer.offsetHeight / 2)+ "px";

    const artistImage3 = document.createElement("img");
    artistImage3.src = data.items[2].images[0].url;
    artistImage3.style.width = (otherArtistsContainer.offsetHeight / 2)+ "px";
    artistImage3.style.height = (otherArtistsContainer.offsetHeight / 2)+ "px";

    const artistImage4 = document.createElement("img");
    artistImage4.src = data.items[3].images[0].url;
    artistImage4.style.width = (otherArtistsContainer.offsetHeight / 2)+ "px";
    artistImage4.style.height = (otherArtistsContainer.offsetHeight / 2)+ "px";

    const artistImage5 = document.createElement("img");
    artistImage5.src = data.items[4].images[0].url;
    artistImage5.style.width = (otherArtistsContainer.offsetHeight / 2)+ "px";
    artistImage5.style.height = (otherArtistsContainer.offsetHeight / 2)+ "px";
    
    otherArtistsContainer.appendChild(artistImage2);
    otherArtistsContainer.appendChild(artistImage3);
    otherArtistsContainer.appendChild(artistImage4);
    otherArtistsContainer.appendChild(artistImage5);
}

function handleRedirect() {
    let code = getCode();
    
    getAccessToken(code);
    
    //window.history.pushState("", "", REDIRECT_URI);
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

function toggleModal(){
    var blur = document.getElementById('blur');
    blur.classList.toggle('active');
    var modal = document.getElementById('modal');
    modal.classList.toggle('active');
}

function logOut() {
    const url = 'https://accounts.spotify.com/en/logout';                                                                                                                                                                                                                                                                             
    const spotifyLogoutWindow = window.open(url, 'Spotify Logout', 'width=700,height=500,top=40,left=40');                                                                                                
    setTimeout(() => spotifyLogoutWindow.close(), 2000);
    setTimeout(() => window.location.replace(INDEX_URI), 2000);
}

function changeUnderline(btn, option) {
    const btns = document.querySelectorAll(option);
    btns.forEach(btn => {
        if (btn.classList.contains('underline')){
            btn.classList.remove('underline');
            btn.classList.add('no-underline');
        }
    });
    btn.classList.remove('no-underline');
    btn.classList.add('underline');
}

const timeBtns = document.querySelectorAll('.time-option');
timeBtns.forEach(btn => btn.addEventListener('click', () => changeUnderline(btn, '.time-option')));
const awardBtns = document.querySelectorAll('.award-option');
awardBtns.forEach(btn => btn.addEventListener('click', () => changeUnderline(btn, '.award-option')));

document.addEventListener("DOMContentLoaded", function(event) { 
    document.getElementById("artist-btn").click();
});



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

