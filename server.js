let express = require("express");
let app = express();
let bodyParser = require("body-parser");

const url = require('url');
const querystring = require('querystring');;
const Database = require("./Database");
const Mailer = require("./Mailer");

let ipUrl = "172.20.177.52"


//{user_id : id, user_token : toker}
let privacy = [];


app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
})


app.use(
    bodyParser.urlencoded({ extended: true })
);


let refreshPrivacy = () => {
    setInterval(function() {
        for (i = 0; i < privacy.length; i++) {
            console.log(privacy[i]);
            if ((new Date().getTime() - privacy[i].timestamp) >= 900000) {
                console.log("Token " + privacy[i].token + " a été supprimé");
                privacy.splice(i, 1);
            }
        }


    }, 300000);

}

refreshPrivacy();



let getPrivacySettingsByIP = (ip) => {
    for (i = 0; i < privacy.length; i++) {
        if (ip == privacy[i].adresseIP) {
            return (privacy[i]);
        }

    }
    return (null);
}

app.get('/application', function(request, response) {
    if (getPrivacySettingsByIP(request.socket.remoteAddress) && request.query.token == getPrivacySettingsByIP(request.socket.remoteAddress).token) {
        console.log("Adresse IP (" + request.socket.remoteAddress + ") a l'accès : " + getPrivacySettingsByIP(request.socket.remoteAddress).type_login);
        if (getPrivacySettingsByIP(request.socket.remoteAddress).type_login == "admin") {
            response.sendFile(__dirname + '/admin.html');
        } else {
            if (getPrivacySettingsByIP(request.socket.remoteAddress).type_login == "client") {
                response.sendFile(__dirname + '/client.html');
            } else {
                response.sendFile(__dirname + '/index.html');
            }

        }
    } else {
        response.sendFile(__dirname + '/index.html');
    }
})


app.get('/addResponse', function(request, response) {
    let idTicket = request.query.idTicket;
    let message = request.query.message;
    let dateStamp = new Date().getTime();

    console.log(idTicket);
    console.log(message);
    console.log(dateStamp);


    if (!getPrivacySettingsByIP(request.socket.remoteAddress)) {
        response.sendStatus(403);
        return;
    }


    let db = new Database();
    db.AddMessage(message, idTicket, getPrivacySettingsByIP(request.socket.remoteAddress).idContrat, dateStamp, function(cb) {
        if (getPrivacySettingsByIP(request.socket.remoteAddress).idContrat != "878948946587456465874612") {
            let mailer = new Mailer();
            //mailer.send(getPrivacySettingsByIP(request.socket.remoteAddress).mail, "[Zenguard] Avis de réponse sur votre ticket " + idTicket, "Votre ticket a reçu une réponse de la part d'un administrateur !");
        } else {
            let mailer = new Mailer();
            //mailer.send("franckstrjd@gmail.com", "[Zenguard] Avis de réponse sur le ticket "+idTicket, "Votre ticket a reçu une réponse de la part d'un client !");
        }
        response.send(cb);
    })

})





app.post('/createTicket', function(request, response) {

    if (!getPrivacySettingsByIP(request.socket.remoteAddress)) {
        response.sendStatus(403);
        return;
    }

    let contratIDdonne = request.body.contratID ? request.body.contratID : getPrivacySettingsByIP(request.socket.remoteAddress).idContrat;
    let message = request.body.message;
    let date = new Date()
    let dateStamp = new Date().getTime();

    console.log(request.body);




    let db = new Database();
    db.createTicket(contratIDdonne, dateStamp, function(cb) {
        if (cb.status == "OK") {

            //let mailer = new Mailer();
            //mailer.send("franckstrjd@gmail.com", "[ZENGUARD] Création d'un ticket par un client", "Un nouveau ticket est disponible dans l'espace admin au numéro " + cb.ticket._id);

            db.AddMessage(message, cb.ticket._id, getPrivacySettingsByIP(request.socket.remoteAddress).idContrat, dateStamp, function(cb) {
                response.redirect(ipUrl + "/application ? token = " + getPrivacySettingsByIP(request.socket.remoteAddress).token);

            });
        } else {
            response.sendStatus(501);
        }
    })

})



app.post('/closeTicket', function(request, response) {

    console.log("Apell à la route closeTicket")
    if (!getPrivacySettingsByIP(request.socket.remoteAddress)) {
        response.sendStatus(403);
        return;
    }


    let id = request.body.ticketID;

    let database = new Database();
    database.changeStatus(id, "Cloturé", (status_obj) => {
        if (status_obj.status == "OK") {
            response.send({ status: "OK", token: getPrivacySettingsByIP(request.socket.remoteAddress).token });
            var pdf = require("pdf-creator-node");
            var fs = require("fs");
            var html = fs.readFileSync("template.html", "utf8");

            var users = [];
            database.findMessages(id, function(cb) {
                users = cb.reponses;
                for (let i = 0; i < users.length; i++) {
                    var date = new Date(parseInt(users[i].timestamp_message));
                    users[i].timestamp_message = date.toLocaleString();
                    users[i].idContrat = users[i].idContrat == "878948946587456465874612" ? "Administrateur" : users[i].idContrat;
                    users[i].color = users[i].idContrat == "Administrateur" ? "bg-warning" : "bg-primary";
                    if (i == users.length - 1) {
                        users[i].color = "bg-success";
                    }
                }


                var dateTicket;
                var creator;


                database.findTicket(id, function(cb) {
                    console.log(cb.ticket);
                    dateTicket = new Date(parseInt(cb.ticket.date_creation)).toLocaleString();

                    creator = cb.idContrat == "878948946587456465874612" ? "Administrateur" : cb.ticket.idContrat;

                    console.log("Date ticket fermé : " + dateTicket);
                    console.log(users);

                    var document = {
                        html: html,
                        data: {
                            users: users,
                            ticket_id: id,
                            time: dateTicket,
                            createur: creator,
                        },
                        path: "pdfs/" + new Date().getTime() + ".pdf",
                        type: "",
                    };

                    var options = {
                        format: "A3",
                        orientation: "portrait",
                        border: "10mm",
                        header: {
                            height: "45mm",
                            contents: 'Cloture de l\'incident n°' + id + ' créé le ' + dateTicket,
                        },
                        footer: {
                            height: "28mm",
                            contents: {}
                        }
                    };



                    pdf.create(document, options).then((res) => {
                        console.log(res.filename);
                    }).catch((error) => {
                        console.error(error);
                    });


                });

            });


        } else {
            response.send({ status: "NOK" });
        }
    })





})




app.get('/getAllTickets', function(request, response) {
    if (!getPrivacySettingsByIP(request.socket.remoteAddress)) {
        response.sendStatus(403);
        return;
    } else {
        let db = new Database();
        db.getAllTickets(function(cb) {
            response.send(cb);
        });
    }


})



app.get('/getAllDatabaseTickets', function(request, response) {
    if (!getPrivacySettingsByIP(request.socket.remoteAddress)) {
        response.sendStatus(403);
        return;
    } else {
        let db = new Database();
        db.getDatabaseTickets(function(cb) {
            response.send(cb);
        });
    }


})


app.get('/getTicketByID', function(request, response) {

    if (!getPrivacySettingsByIP(request.socket.remoteAddress)) {
        response.sendStatus(403);
        return;
    }
    const ticket_ID = request.query.idTicket;
    let db = new Database();
    db.findTicket(ticket_ID, function(cb) {
        response.send(cb);
    });


})


app.get('/getTicketByContrat', function(request, response) {

    if (!getPrivacySettingsByIP(request.socket.remoteAddress)) {
        response.sendStatus(403);
        return;
    }
    const ticket_ID = getPrivacySettingsByIP(request.socket.remoteAddress).idContrat;
    console.log(ticket_ID);
    let db = new Database();
    db.findTicketByContrat(ticket_ID, function(cb) {
        console.log(cb)
        response.send(cb);
    });


})




app.get('/findmessages', function(request, response) {

    if (!getPrivacySettingsByIP(request.socket.remoteAddress)) {
        response.sendStatus(403);
        return;
    }
    const ticket_ID = request.query.idTicket;
    let db = new Database();


    db.findMessages(ticket_ID, function(cb) {
        response.send({ cb: cb, idContrat: getPrivacySettingsByIP(request.socket.remoteAddress).idContrat });

        if (getPrivacySettingsByIP(request.socket.remoteAddress).idContrat == "878948946587456465874612") {
            db.changeStatus(ticket_ID, "Répondu", function(cb) {

            });
        }

    });


})


app.post("/deconnexion", function(req, res) {
    privacy = privacy.filter(x => x.adresseIP != req.socket.remoteAddress);
    console.log("test deconnexion");
    res.send(200);

})


app.post('/connexion', function(request, response) {
    let contratID = request.body.contratID;
    let mail = request.body.mail;

    console.log(contratID, mail);

    /*app.get('serverfront/requeteAuthentification', {contratID: contratID, mail: mail}, (result) => {

    	if(result){*/

    if (contratID == "878948946587456465874612") {
        result = { type_login: "admin", token: "DCBA", adresseIP: request.socket.remoteAddress, idContrat: contratID, mail: mail };
    } else {
        result = { type_login: "client", token: "ABCD", adresseIP: request.socket.remoteAddress, idContrat: contratID, mail: mail };
    }


    console.log(result);

    //let mailer = new Mailer();
    //mailer.send(mail, "[ZENGUARD] Token d'activation", "Voici votre token d'activation : " + result.token)


    result.timestamp = new Date().getTime();
    privacy.push(result);
    /*}


		
	});*/

})

app.post('/testConnection', function(request, response) {

    let token = request.body.token;

    if (token == getPrivacySettingsByIP(request.socket.remoteAddress).token) {
        response.send({ access: "ok", route: "/application" });
    } else {
        response.send({ access: "nok" });
    }



})


var server = app.listen(80, function() {
    var host = server.address().address
    var port = server.address().port

    console.log("Example app listening at http://%s:%s", host, port)
})