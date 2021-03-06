(function(){ //Encapsulation by IIFE


var mysql = require("mysql");
var inquirer = require('inquirer');
var Table = require('cli-table');
require('dotenv').config()

// var ui = new inquirer.ui.BottomBar();


var connection = mysql.createConnection({
  host: process.env.DB_HOST,

  // Your port; if not 3306
  port: process.env.DB_PORT,

  // Your username
  user: process.env.DB_USER,

  // Your password
  password: process.env.DB_PASS,
  database: process.env.DB_DATABASE
});


  connection.connect(function(err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId);
    showOpions();
    // connection.end();
  });


  function showOpions(){
    inquirer
    .prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Hi! Select your action please.',
        choices: ['View products for sale',
                 'View low inventory',
                 'Add to inventory',
                 'Add new product']
      },
    ])
    .then(answers => {
      // console.log(JSON.stringify(answers, null, '  '));
      var actionSelection = answers.action;
    //   console.log('You selected: '+ actionSelection);
    //   showproducts(departmentSelection);
    switch(actionSelection) {
        case 'View products for sale':
            chooseDepartment();
            break;
        case 'View low inventory':
        viewLowInventory();
            break;
        case 'Add to inventory':
        checkData();
        break;
        case 'Add new product':
        addNewProduct();
        break;
        default:
            console.log('No option exists')
    }
    })
  }

  function chooseDepartment(){
      console.log('View Products');

      connection.query("SELECT products.department_name FROM products GROUP BY products.department_name", function(err, res) {
        if (err) throw err;
        // console.log(res);
        var departmentArray = [];

        for (var i =0; i < res.length ; i++){
            // console.log(res[i].department_name);
            departmentArray.push(res[i].department_name)
        }
        // console.log(departmentArray);

  inquirer
  .prompt([
    {
      type: 'list',
      name: 'department',
      message: 'Which department would you like to view products?',
      choices: departmentArray
    },
  ])
  .then(answers => {
    // console.log(JSON.stringify(answers, null, '  '));
    var departmentSelection = answers.department
    console.log('You selected: '+ departmentSelection);
    showproducts(departmentSelection);
  })

      });

  }

  function showproducts(department){
    connection.query("SELECT * FROM products WHERE products.department_name = ?",[department], function(err, res) {
        if (err) throw err;
        // console.log('*****Product Listing Start*****');
        var table = new Table({
            head: ['ID', 'Product Name','Price($)','Stock']
          , colWidths: [5,35,10,10]
        });
        for(var i=0; i<res.length;i++){
            table.push([res[i].id, res[i].product_name , res[i].price,res[i].stock_quantity]);
        }
        console.log(table.toString());

        inquirer
        .prompt([
          {
            type: 'list',
            name: 'action',
            message: 'Would you like to view more departments..?',
            choices: ['yes',
                     'No']
          },
        ])
        .then(answers => {
          // console.log(JSON.stringify(answers, null, '  '));
          var actionSelection = answers.action;

          if (actionSelection === 'yes'){
            chooseDepartment();
          } else {console.log('Thank You have a nice day!!')
                  connection.end();
                  }
        
        
        });
  });
}

  function viewLowInventory(){
    // console.log('View low inv');
    var lowCheck = 5;
    connection.query("SELECT * FROM products WHERE products.stock_quantity < ?",[lowCheck], function(err, res) {
        if (err) throw err;
    
    console.log("****Low Inventory Data****Display products that have less than 5 units");

    var table = new Table({
        head: ['ID', 'Product Name','Price($)','Stock']
      , colWidths: [5,35,10,10]
    });
    for(var i=0; i<res.length;i++){
        table.push([res[i].id, res[i].product_name , res[i].price,res[i].stock_quantity]);
    }
    console.log(table.toString());
    connection.end();

    
    })
  }

  function validateInput(input){
    // var reg = /^\d+$/;
    var reg = /^[0-9][\.\d]*(,\d+)?$/;
   return reg.test(input) || "Entry should be a number!";
  }

  function validateNames(input){
    
    if (input === "") return false
    else return true
   
  }

  function checkData(){
      console.log('Add Inventory');
      inquirer
      .prompt([
        {
          type: 'name',
          name: 'id',
          message: 'Enter product id of product you would like to add more of?',
          validate: validateInput
        },
      ])
      .then(answers => {
        // console.log(JSON.stringify(answers, null, '  '));
        var idSelection = answers.id;
        console.log('you selected productID: '+ idSelection);

        connection.query("SELECT * FROM products WHERE products.id = ?",[idSelection], function(err, res) {
            if (err) throw err;
            if (res.length === 0) {console.log('Product mismatch..Try again')
            connection.end()}
            else {
                var table = new Table({
                    head: ['ID', 'Product Name','Price($)','Stock']
                  , colWidths: [5,35,10,10]
                });
                
                    table.push([res[0].id, res[0].product_name , res[0].price,res[0].stock_quantity]);
                    var availStock = res[0].stock_quantity;
                    console.log(table.toString());
                    addInventory(idSelection,availStock);


            }
        });
      });
  }

  function addInventory(id,availStock){

    inquirer
      .prompt([
        {
          type: 'name',
          name: 'quantity',
          message: 'How many units would you like to add..?',
          validate: validateInput
        },
      ])
      .then(answers => {
        // console.log(JSON.stringify(answers, null, '  '));
        var addStock = parseInt(answers.quantity);
        var available = parseInt(availStock);
        var totStock = available + addStock;
        connection.query("UPDATE products SET products.stock_quantity = ? WHERE id = ?",[totStock,id], function(err, res) {
        if (err) throw err;
        viewChangedInventory(id);
        
    });
      });
  }

  function viewChangedInventory(id){
    
    console.log("OK..Inventory Update made..please check current listing below");

    connection.query("SELECT * FROM products WHERE products.id = ?",[id], function(err, res) {
        if (err) throw err;
        // console.log('*****Product Listing Start*****');
        var table = new Table({
            head: ['ID', 'Product Name','Price($)','Modified Stock']
          , colWidths: [5,35,10,20]
        });
        for(var i=0; i<res.length;i++){
            table.push([res[i].id, res[i].product_name , res[i].price,res[i].stock_quantity]);
        }
        console.log(table.toString());
        connection.end();

  });
}


  function addNewProduct(){
    console.log('Add New product');

    inquirer
    .prompt([
      {
        type: 'name',
        name: 'prodName',
        message: 'Enter name of product:',
        validate: validateNames
      },
      {
        type: 'name',
        name: 'deptName',
        message: 'Enter department Name:',
        validate: validateNames
      },
      {
        type: 'name',
        name: 'price',
        message: 'Enter unit price of product:',
        validate: validateInput
      },
      {
        type: 'name',
        name: 'stock',
        message: 'Enter stock available:',
        validate: validateInput
      },
    ])
    .then(answers => {
      // console.log(JSON.stringify(answers, null, '  '));
      var name = answers.prodName;
      var department = answers.deptName;
      var price = parseFloat(answers.price).toFixed(2);
      var stock = parseInt(answers.stock);
      var id;

      console.log(name);
      console.log(department);
      console.log(price);
      console.log(stock);

     connection.query("INSERT INTO products (product_name,department_name,price,stock_quantity) VALUES (?,?,?,?)",[name,department,price,stock], function(err, res) {
      if (err) throw err;
      id = res.insertId;
      viewChangedInventory(id);
    });

    // connection.end();

    });

    

    
  }
})(); //Encapsulation by IIFE