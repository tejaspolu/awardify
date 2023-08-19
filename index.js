const APIController = (function() {
    const clientId = "61306c8268a04a0dbbed3fc83dac6d2e"
    const clientSecret = "5fc33a1630e84da5b25574f1ab64e53b"

    const _getToken = async() => {

        //sending a POST request and getting token from spotify
        const result = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Authorization' : 'Basic' + btoa(clientId + ':' + clientSecret)
            },
            body: 'grant_type=client_credentials'
        });
        
        //converting the result to json and specifically returning the access token
        const data = await result.json();
        return data.access_token;
    }

    const _getTopArtists = async(token) => {
        const limit = 5;
        const result = await fetch(`https://api.spotify.com/v1/me/top/artists?limit=5${limit}&offset=0`, {
            method: 'GET',
            headers: {'Authorization' : 'Bearer' + token}
        })
        const data = await result.json();
        return data.artists;
    }

    //making public methods
    return {
        getToken() {
            return _getToken();
        },
        getTopArtists() {
            return _getTopArtists(token);
        }
    }
})();

const UIController = (function() {})();

const APPController = (function(UICtrl, APICtrl) {
    const token = APICtrl.getToken();
    console.log(token);
})(UIController, APIController);



