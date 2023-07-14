const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb+srv://admin-sahil:CvCCdbHnKgiGUvG1@cluster0.5ow4l41.mongodb.net/todolistDB');
}

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
  name: 'Welcome to your todolist!'
});

const item2 = new Item({
  name: 'Hit the + button to add a new item.'
});

const item3 = new Item({
  name: '<-- Hit this to delete an item.'
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model('List', listSchema);

const day = date.getDate();

app.get("/", function (req, res) {

  Item.find().then(function (foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems).then(() => console.log('Items loaded successfully!'));
      res.redirect("/");
    } else {
      res.render("list", { listTitle: day, newListItems: foundItems });
    }
  });

});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listTitle = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listTitle === day) {
    item.save().then(() => console.log('Item loaded!'));
    res.redirect("/");
  } else {
    List.findOne({ name: listTitle }).then(function (foundList) {
      foundList.items.push(item);
      foundList.save().then(() => console.log('Item loaded!'));
      res.redirect("/" + listTitle);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listTitle = req.body.list;

  if (listTitle === day) {
    Item.findByIdAndRemove(checkedItemId).then(() => console.log('Item deleted!'));
    res.redirect("/");
  } else {
    List.findOneAndUpdate({ name: listTitle }, { $pull: { items: { _id: checkedItemId } } }).then(function (foundList) {
      res.redirect("/" + listTitle);
    });
  }
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }).then(function (foundList) {
    if (!foundList) {
      // Create a new list
      const list = new List({
        name: customListName,
        items: defaultItems
      });

      list.save().then(() => console.log('List loaded!'));
      res.redirect("/" + customListName);

    } else {
      // Show an existing list
      res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
