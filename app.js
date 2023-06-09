//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require('mongoose')
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://0.0.0.0/todoListDB", {useNewUrlParser: true})
  .then(()=>{
  console.log("Connected to mongodb")
})
  .catch((err)=>{
    console.log(err)
  })


const itemsSchema = {
  name : String
};

const Item = mongoose.model("item", itemsSchema )

const item1 = new Item ({
  name: "Welcome to your todo-List"
});
const item2 = new Item ({
  name: "Hit the + button to add a new item."
});
const item3 = new Item ({
  name: "<-- Hit this to delete an item."
});

// adding the above three items as default
const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String, 
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema)


app.get("/", function(req, res) {

  Item.find({})
  .then((foundItems)=>{

    if(foundItems.length === 0){
      Item.insertMany(defaultItems)
        .then(()=>{
          console.log("Successfully saved default items to DB.");
        })
        .catch((err)=>{
          console.log(err);
        });

      res.redirect("/");
    }
    
    else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }

    
  })
  .catch((err)=>{
    console.log(err)
  })
});


app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName})
  .then(function(foundList){
      if(!foundList){
        
        //create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
      
        list.save();
        res.redirect("/" + customListName);
      }
      else{
        //show existing list

        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }  
  })
  .catch((err)=>{
    console.log(err);
  });

  

});


app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;


  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }
  else{
    List.findOne({name: listName})
    .then((foundList)=>{
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
    .catch((err)=>{
      console.log(err)
    })
  }
  
});


app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId)
    .then(()=>{
      console.log("Successfully deleted the item.")
      res.redirect("/")  //to reflect the change on the interface
    })
    .catch((err)=>{
      console.log(err)
    })
  }
  else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}})
    .then(()=>{
      res.redirect("/" + listName);
    })
  } 

  

})




app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
