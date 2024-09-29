const express = require('express')
const app = express()
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const format = require('date-fns/format')
const isMatch = require('date-fns/isMatch')
const isValid = require('date-fns/isValid')

app.use(express.json())
const dbPath = path.join(__dirname, 'todoApplication.db')
let db

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running at https://localhost:3000/')
    })
  } catch (err) {
    console.log(`DB Error: ${err.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusPriority = requestQuery => {
  return requestQuery.status !== undefined
}

const hasCategoryProperty = requestQuery => {
  requestQuery.category !== undefined
}

const hasCategoryAndStatusProperties = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}

const hasCategoryAndPriorityProperties = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  )
}

const hasSearchProperty = requestQuery => {
  return requestQuery.search_q !== undefined
}

const convertDataIntoResponseObject = dbObject => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  }
}

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodos = ''
  const {search_q = '', priority, status, category} = request.query
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodos = `SELECT * FROM todo WHERE status = '${status}' AND priority = '${priority}';`
          data = await db.all(getTodos)
          response.send(data.map(each => convertDataIntoResponseObject(each)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case hasCategoryAndStatusProperties(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodos = `SELECT * FROM todo WHERE status = '${status}' AND category = '${category}';`
          data = await db.all(getTodos)
          response.send(data.map(each => convertDataIntoResponseObject(each)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case hasCategoryAndPriorityProperties(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          priority === 'HIGH' ||
          priority === 'MEDIUM' ||
          priority === 'LOW'
        ) {
          getTodos = `SELECT * FROM todo WHERE priority = '${priority}' AND category = '${category}';`
          data = await db.all(getTodos)
          response.send(data.map(each => convertDataIntoResponseObject(each)))
        } else {
          response.status(400)
          response.send('Invalid Todo Priority')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case hasPriorityProperty(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        getTodos = `SELECT * FROM todo WHERE priority = '${priority}';`
        data = await db.all(getTodos)
        response.send(data.map(each => convertDataIntoResponseObject(each)))
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case hasStatusPriority(request.query):
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        getTodos = `SELECT * FROM todo WHERE status = '${status}';`
        data = await db.all(getTodos)
        response.send(data.map(each => convertDataIntoResponseObject(each)))
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break

    case hasSearchProperty(request.query):
      getTodos = `SELECT * FROM todo WHERE todo like '%${search_q}%';`
      data = await db.all(getTodos)
      response.send(data.map(each => convertDataIntoResponseObject(each)))
      break

    case hasCategoryProperty(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        getTodos = `SELECT * FROM todo WHERE category = '${category}';`
        data = await db.all(getTodos)
        response.send(data.map(each => convertDataIntoResponseObject(each)))
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    default:
      getTodos = `SELECT * FROM todo;`
      data = await db.all(getTodos)
      response.send(data.map(each => convertDataIntoResponseObject(each)))
  }
})

app.get('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`
  const responseRes = await db.get(getTodoQuery)
  response.send(convertDataIntoResponseObject(responseRes))
})

app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  console.log(isMatch(date, 'yyyy-MM-dd'))
  if (isMatch(date, 'yyyy-MM-dd')) {
    const newDate = format(new Date(date), 'yyyy-MM-dd')
    console.log(newDate)
    const requestQuery = `SELECT * FROM todo WHERE due_date = '${newDate}';`
    const responseRes = await db.all(requestQuery)
    response.send(responseRes.map(each => convertDataIntoResponseObject(each)))
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body
  if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
    if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (isMatch(dueDate, 'yyyy-MM-dd')) {
          const postNewDate = format(new Date(dueDate), 'yyyy-MM-dd')
          const postTodoQuery = `INSERT INTO todo (id, todo, category, priority, status, due_date)
          VALUES
            (${id}, '${todo}', '${category}', '${priority}', '${status}', '${postNewDate}');`
          await db.run(postTodoQuery)
          response.send('Todo Successfully Added')
        } else {
          response.status(400)
          response.send('Invalid Due Date')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  } else {
    response.status(400)
    response.send('Invalid Due Priority')
  }
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let updateColumn = ''
  const requestBody = request.body
  console.log(request.body)
  const previousTodo = `SELECT * FROM todo WHERE id = ${todoId};`
  const previous = await db.get(previousTodo)
  const {
    todo = previous.todo,
    priority = previous.priority,
    status = previous.status,
    category = previous.category,
    dueDate = previous.dueDate,
  } = request.body

  let updateTodo
  switch (true) {
    case requestBody.status !== undefined:
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        updateTodo = `UPDATE todo SET todo = '${todo}', priority = '${priority}',
      status = '${status}', category = '${category}', due_date = '${dueDate}' WHERE id = ${todoId};`
        await db.run(updateTodo)
        response.send('Status Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break

    case requestBody.priority !== undefined:
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        updateTodo = `UPDATE todo SET todo = '${todo}', priority = '${priority}', status = '${status}', category = '${category}', due_date = '${dueDate}' WHERE id = ${todoId};`
        await db.run(updateTodo)
        response.send('Priority Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case requestBody.todo !== undefined:
      updateTodo = `UPDATE todo SET todo = '${todo}', priority = '${priority}', status = '${status}', category = '${category}', due_date = '${dueDate}' WHERE id = ${todoId};`
      await db.run(updateTodo)
      response.send('Todo Updated')
      break

    case requestBody.category !== undefined:
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        updateTodo = `UPDATE todo SET todo = '${todo}', priority = '${priority}', status = '${status}', category = '${category}', due_date = '${dueDate}' WHERE id = ${todoId};`
        await db.run(updateTodo)
        response.send('Category Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, 'yyyy-MM-dd')) {
        const newDueDate = format(new Date(dueDate), 'yyyy-MM-dd')
        updateTodo = `UPDATE todo SET todo = '${todo}', priority = '${priority}', status = '${status}', category = '${category}', due_date = '${dueDate}' WHERE id = ${todoId};`
        await db.run(updateTodo)
        response.send('Due Date Updated')
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
      break
  }
})

app.delete('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  const deleteQuery = `DELETE FROM todo WHERE id = ${todoId};`
  await db.run(deleteQuery)
  response.send('Todo Deleted')
})

module.exports = app
