const request = require('request');
class RestAPI {

    static async  execute(options) {
        return new Promise((resolve, rejet) => {
            request(options, (error, response, body) => {
                console.log('!!!!!!!!1ERROR')
                console.log(error)
                console.log('!!!!!!!!response')
                console.log(JSON.stringify(response))
                console.log('!!!!!!!!BODY')
                console.log(JSON.stringify(body))
                if (!error) {
                    resolve((body));
                } else {
                    rejet(error)
                }
            }).on('error', function(err) {
                console.error('listining error')
                console.error(err)
              })
        });
    }
}

module.exports = RestAPI