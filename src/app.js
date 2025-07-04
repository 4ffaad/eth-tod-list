App = {
  loading: false,
  contracts: {},

  load: async () => {
    await App.loadWeb3()
    await App.loadAccount()
    await App.loadContract()
    await App.render()
  },

  loadWeb3: async () => {
    if (window.ethereum) {
      App.web3Provider = window.ethereum
      window.web3 = new Web3(window.ethereum)
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' })
      } catch (error) {
        console.error('User denied account access')
      }
    } else if (window.web3) {
      // Legacy dapp browsers...
      App.web3Provider = window.web3.currentProvider
      window.web3 = new Web3(window.web3.currentProvider)
    } else {
      alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  },

  loadAccount: async () => {
    // Modern web3 requires asynchronous call to get accounts:
    const accounts = await web3.eth.getAccounts()
    App.account = accounts[0]
  },

  loadContract: async () => {
    const todoList = await $.getJSON('../build/contracts/TodoList.json')
    App.contracts.TodoList = TruffleContract(todoList)
    App.contracts.TodoList.setProvider(App.web3Provider)
    App.todoList = await App.contracts.TodoList.deployed()
  },

  render: async () => {
    if (App.loading) return

    App.setLoading(true)
    $('#account').html(App.account)
    await App.renderTasks()
    App.setLoading(false)
  },

  renderTasks: async () => {
    const taskCount = await App.todoList.taskCount()
    const $taskTemplate = $('.taskTemplate')

    for (let i = 1; i <= taskCount; i++) {
      const task = await App.todoList.tasks(i)
      const taskId = task[0].toNumber()
      const taskContent = task[1]
      const taskCompleted = task[2]

      const $newTaskTemplate = $taskTemplate.clone()
      $newTaskTemplate.find('.content').html(taskContent)
      $newTaskTemplate.find('input')
                      .prop('name', taskId)
                      .prop('checked', taskCompleted)
                      .on('click', App.toggleCompleted)

      if (taskCompleted) {
        $('#completedTaskList').append($newTaskTemplate)
      } else {
        $('#taskList').append($newTaskTemplate)
      }

      $newTaskTemplate.show()
    }
  },

  createTask: async () => {
    App.setLoading(true)
    const content = $('#newTask').val()
    await App.todoList.createTask(content)
    window.location.reload()
  },

  toggleCompleted: async (e) => {
    App.setLoading(true)
    const taskId = e.target.name
    await App.todoList.toggleCompleted(taskId)
    window.location.reload()
  },

  setLoading: (boolean) => {
    App.loading = boolean
    const loader = $('#loader')
    const content = $('#content')
    if (boolean) {
      loader.show()
      content.hide()
    } else {
      loader.hide()
      content.show()
    }
  }
}
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('taskForm')
  form.addEventListener('submit', (e) => {
    e.preventDefault()   // Prevent page reload
    App.createTask()     // Call your existing createTask method
  })
})


$(() => {
  $(window).on('load', () => {
    App.load()
  })
})
