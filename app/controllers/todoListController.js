const mongoose = require('mongoose')
const Response = require('../lib/generateResponseLib')
const logger = require('../lib/loggerLib')
const util = require('../lib/utilityLib')

const TodoLists = mongoose.model('TodosList');
const Todo = mongoose.model('Todo');

/* Save User Lists of TODOS */
let saveList = (req, res) => {
    if (req.body.userId && req.body.lists) {
        let lists = JSON.parse(req.body.lists);

        TodoLists.findOne({ userId: req.body.userId }, (error, result) => {
            if (error) {
                console.log(error)
                logger.error('Error occurred while retrieval from database.', 'todoListController: saveList()', 10);
                let apiResponse = Response.generate(true, 'Failed to save User Todo List!! Some internal error occurred.', 500, null);
                res.send(apiResponse);
            }
            else {
                console.log("-- findOne result--")
                console.log(result)

                let newTodoLists = new TodoLists({
                    userId: req.body.userId,
                    listNames: lists,
                    lastModified: new Date(),
                    createdOn: new Date()
                });

                let upsertData = newTodoLists.toObject();
                delete upsertData._id; // mandatory so as to upsert
                console.log("--Upsert Data--")
                console.log(upsertData)

                TodoLists.updateOne({ userId: req.body.userId }, upsertData, { upsert: true },
                    (err, rawMessage) => {
                        if (error) {
                            console.log(err)
                            logger.error('Error occurred while saving at database.', 'todoListController: saveList()', 10);
                            let apiResponse = Response.generate(true, 'Failed to save User Todo List!! Some internal error occurred.', 500, null);
                            res.send(apiResponse);
                        }
                        else {
                            console.log(rawMessage)
                            logger.info('TODO List saved!!', 'todoListController: saveList()', 10)
                            let apiResponse = Response.generate(false, 'TODO List created!!', 200, newTodoLists);
                            res.send(apiResponse);
                        }
                    }) //saved TODO List in database
            }
        })
    }
} // END saveList() 

/* Get names of all TODO Lists */
let getAllLists = (req, res) => {
    if (req.query.userId) {
        TodoLists.findOne({ userId: req.query.userId }, {},
            { sort: { 'createdOn': -1 } }, (err, result) => {
                if (err) {
                    console.log(err)
                    logger.error('Error occurred while retrieving from database.', 'todoListController: getAllLists()', 10);
                    let apiResponse = Response.generate(true, 'Failed to retrieve!! Some internal error occurred', 500, null);
                    res.send(apiResponse);
                }
                else if (util.isEmpty(result)) {
                    let apiResponse = Response.generate(true, 'Retrieval Failed!! Invalid UserId or No List yet', 404, null);
                    res.send(apiResponse);
                }
                else {
                    console.log(result.listNames)
                    let apiResponse = Response.generate(false, 'Retrieval Successful', 200, result.listNames);
                    res.send(apiResponse);
                }
            })
    }
    else {
        let apiResponse = Response.generate(true, 'UserId field empty', 400, null);
        res.send(apiResponse);
    }
} // END getAllLists()

/* Save TODO List */
let saveTodo = (req, res) => {
    if (util.isObjectEmpty(req.body)) {
        let apiResponse = Response.generate(true, 'Save Failed !! One or More Parameters are Missing.', 400, null);
        res.send(apiResponse);
    }
    else {
        let data = JSON.parse(req.body.TodoList);

        let newTodo = new Todo({
            listName: req.body.listName,
            userId: req.body.userId,
            TodoList: data,
            createdOn: new Date()
        });

        let upsertData = newTodo.toObject();
        delete upsertData._id;   // mandatory so as to upsert

        Todo.updateOne({ userId: req.body.userId, listName: req.body.listName }, upsertData,
            { upsert: true }, (error, rawMessage) => {
                if (error) {
                    console.log(error)
                    logger.error('Error occurred while saving at database.', 'todoListController: saveTodo()', 10);
                    let apiResponse = Response.generate(true, 'Failed to save User Todo List!! Some internal error occurred.', 500, null);
                    res.send(apiResponse);
                }
                else {
                    console.log("-- updateOne result--")
                    console.log(rawMessage)
                    logger.info('TODO List saved!!', 'todoListController: saveTodo()', 10)
                    let apiResponse = Response.generate(false, 'TODO List saved!!', 200, upsertData);
                    res.send(apiResponse);
                }
            }) //saved TODO List in database
    }
} // END saveTodo()


/* Get a particular TODO List */
let getTodo = (req, res) => {
    if (req.query.userId && req.query.listname) {
        Todo.findOne({ userId: req.query.userId, listName: req.query.listname }, (err, result) => {
                if (err) {
                    console.log(err)
                    logger.error('Error occurred while retrieving from database.', 'todoListController: getTodo()', 10);
                    let apiResponse = Response.generate(true, 'Failed to retrieve!! Some internal error occurred', 500, null);
                    res.send(apiResponse);
                }
                else if (util.isEmpty(result)) {
                    let apiResponse = Response.generate(true, 'Retrieval Failed!! Invalid UserId or List is empty', 404, null);
                    res.send(apiResponse);
                }
                else {
                    console.log(result.TodoList)
                    let apiResponse = Response.generate(false, 'Retrieval Successful', 200, result.TodoList);
                    res.send(apiResponse);
                }
            })
    }
    else {
        let apiResponse = Response.generate(true, 'One or More Parameters are Missing.', 400, null);
        res.send(apiResponse);
    }
} //END getTodo()

module.exports = {
    saveList: saveList,
    saveTodo: saveTodo,
    getTodo: getTodo,
    getAllLists: getAllLists
}