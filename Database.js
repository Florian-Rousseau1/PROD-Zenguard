let Datastore = require("nedb");



class Database {
    constructor(){
        this.db = new Datastore({filename: "db.db", autoload: true});
    }


    //Fonction qui permet de récupérer tous les tickets
    getAllTickets(callback){
        this.db.find({table : "ticket",  $or:[{status : "Ouvert"}, {status: "Répondu"}]}, (err, allTickets) => {
            //console.log(allTickets);
            if(allTickets){
                callback({status : "OK", tickets : allTickets});
            
            }else {
                callback({status : "NOK"});
            }
        });
    }


    //Fonction qui permet de récupérer tous les tickets
    getDatabaseTickets(callback){
        this.db.find({table : "ticket"}, (err, allTickets) => {
            //console.log(allTickets);
            if(allTickets){
                callback({status : "OK", tickets : allTickets});
            
            }else {
                callback({status : "NOK"});
            }
        });
    }

    // db.update(query, update, options, callback)

    changeStatus(idTicket, newStatus,  callback){
        this.db.update({_id : idTicket}, {$set: {status : newStatus, date_cloture : new Date().getTime()}}, {},  function(err, data){
            if(err){
                callback({status : "NOK"});
                
            }else{
                callback({status : "OK" });
            }
        })

    }



    //Fonction pour rechercher un ticket Ouvert dans la table des tickets
    findTicket(id, callback){
        this.db.findOne({table : "ticket", _id : id}, (err, findTicket) => {
            if(findTicket){
                callback({status : "OK", ticket : findTicket});
            }else {
                callback({status : "NOK"});
            }
        });
    }


    //Fonction pour rechercher un ticket Ouvert dans la table des tickets
    findTicketByContrat(contrat, callback){

        console.log("side database : "+contrat);

        this.db.find({table : "ticket", idContrat : contrat,}, (err, findTickets) => {
            if(findTickets){
                console.log(findTickets);
                callback({status : "OK", tickets : findTickets});
               
            }else {
                callback({status : "NOK"});
            }
        });
    }


    findMessages(ticketId, callback){


        this.db.find({table : "reponses", idTicket : ticketId}).sort({ timestamp_message: 1 }).exec(function (err, findReponses) {
            if(findReponses){
                callback({status : "OK", reponses : findReponses});
            }else {
                callback({status : "NOK"});
            }

        })

    }


    //Fonction qui permet de créer un ticket
    createTicket(idcontrat, date_creation, callback){
        this.db.insert({table: "ticket",idContrat : idcontrat, date_creation : date_creation, status : "Ouvert"}, function(err, newTicket){
            if(newTicket){
                callback({status : "OK", ticket : newTicket});
            }
        });
    }


    //Ajouter un message à un ticket déjà présent
    AddMessage(message, idTicket, author, timestamp, callback){
        this.db.insert({table: "reponses", idContrat : author, timestamp_message : timestamp, message : message, idTicket: idTicket}, function(err, newMessage){
            if(newMessage){
                callback({status : "OK", message : newMessage});
            }
        });
    }


}
module.exports = Database;

