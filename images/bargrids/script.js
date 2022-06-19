let puzzle = {
  border: 3,  // external border of the puzzle
  size: 50,   // size (width and height) of the squares
  cols: 8,    // number of columns
  rows: 8,    // number of rows
  depth: function() {return size * rows},
  height: function() {return size * rows},
  width: function() {return size * cols},
}

function createSquare(grid, row, col) {
  // create a basic square
  square = document.createElement("div");
  square.id = "square-" + row + "-" + col;
  square.classList.add("grid__square");
  square.style["grid-column"] = (col*2+1) + "/" + (col*2+3);
  square.style["grid-row"] = (row*2+1) + "/" + (row*2+3);
  square.title = "Row: " + (row+1) + ", Column: " + (col+1);
  grid.append(square);
}

function createAcrossBarButton(grid, row, col) {
  across = document.createElement("div");
  across.appendChild(document.createTextNode(""));
  across.id = "acrossbar-button-" + row + "-" + col;
  across.onclick = function() {setAcrossBar(this);};
  across.classList.add("hidden");
  across.classList.add("grid__bar__button");
  across.classList.add("grid__bar__button--across");
  across.style["grid-column"] = (col*2+2) + "/" + (col*2+4);
  across.style["grid-row"] = (row*2+1) + "/" + (row*2+3);
  grid.append(across);
}

function createDownBarButton(grid, row, col) {
  down = document.createElement("div");
  down.appendChild(document.createTextNode(""));
  down.id = "downbar-button-" + row + "-" + col;
  down.onclick = function() {setDownBar(this);};
  down.classList.add("hidden");
  down.classList.add("grid__bar__button");
  down.classList.add("grid__bar__button--down");
  down.style["grid-column"] = (col*2+1) + "/" + (col*2+3);
  down.style["grid-row"] = (row*2+2) + "/" + (row*2+4);
  grid.append(down);
}

function createBarSquare(grid, row, col) {
  barsquare = document.createElement("div");
  barsquare.id = "barsquare-" + row + "-" + col;
  barsquare.classList.add("grid__bar__square");
  barsquare.style["grid-column"] = (col*2+1) + "/" + (col*2+3);
  barsquare.style["grid-row"] = (row*2+1) + "/" + (row*2+3);
  grid.append(barsquare);
}

function createCircleButton(grid, row, col) {
  circle = document.createElement("div");
  circle.id = "circle-button-" + row + "-" + col;
  circle.onclick = function() {setCircle(this);};
  circle.classList.add("hidden");
  circle.classList.add("grid__circle__button");
  circle.style["grid-column"] = (col*2+1) + "/" + (col*2+3);
  circle.style["grid-row"] = (row*2+1) + "/" + (row*2+3);
  grid.append(circle);
}

function createCircleSquare(grid, row, col) {
  circle = document.createElement("div");
  circle.id = "circle-" + row + "-" + col;
  circle.classList.add("grid__circle__square");
  circle.style["grid-column"] = (col*2+1) + "/" + (col*2+3);
  circle.style["grid-row"] = (row*2+1) + "/" + (row*2+3);
  grid.append(circle);
}

function createShadeCircleButton(grid, row, col) {
  // create the shade circle buttons
  shadecircle = document.createElement("div");
  shadecircle.id = "shadecircle-button-" + row + "-" + col;
  shadecircle.onclick = function() {setShadeCircle(this);};
  shadecircle.classList.add("hidden");
  shadecircle.classList.add("grid__shadecircle__button");
  shadecircle.style["grid-column"] = (col*2+1) + "/" + (col*2+3);
  shadecircle.style["grid-row"] = (row*2+1) + "/" + (row*2+3);
  grid.append(shadecircle);
}


function createShadeCircleSquare(grid, row, col) {
  shadecircle = document.createElement("div");
  shadecircle.id = "shadecircle-" + row + "-" + col;
  shadecircle.classList.add("grid__shadecircle__square");
  shadecircle.style["grid-column"] = (col*2+1) + "/" + (col*2+3);
  shadecircle.style["grid-row"] = (row*2+1) + "/" + (row*2+3);
  grid.append(shadecircle);
}


function createShadeSquareButton(grid, row, col) {
  // create the shade square buttons
  shadesquare = document.createElement("div");
  shadesquare.id = "shadesquare-button-" + row + "-" + col;
  shadesquare.onclick = function() {setShadeSquare(this);};
  shadesquare.classList.add("hidden");
  shadesquare.classList.add("grid__shadesquare__button");
  shadesquare.style["grid-column"] = (col*2+1) + "/" + (col*2+3);
  shadesquare.style["grid-row"] = (row*2+1) + "/" + (row*2+3);
  grid.append(shadesquare);
}

function createShadeSquareSquare(grid, row, col) {
  shadesquare = document.createElement("div");
  shadesquare.id = "shadesquare-" + row + "-" + col;
  shadesquare.classList.add("grid__shadesquare__square");
  shadesquare.style["grid-column"] = (col*2+1) + "/" + (col*2+3);
  shadesquare.style["grid-row"] = (row*2+1) + "/" + (row*2+3);
  grid.append(shadesquare);
}

function createEmptyGrid(cols, rows) {
  grid = document.getElementById("grid");

  // remove all elements from the grid
  while (grid.firstChild) {
    grid.removeChild(grid.firstChild);
  }

  // set the grid size style
  grid.style.width = (50 * cols) + "px";
  grid.style.height = (50 * rows) + "px";

  // set the grid template style
  grid_template = "repeat(" + rows*2 + ", " + (100 / (rows*2)) + "%) / repeat(" + cols*2 + ", " + (100 / (cols*2)) + "%)";
  grid.style["grid-template"] = grid_template;

  // Add basic squares
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      createSquare(grid, row, col);
    }
  }

  // Add bar squares
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      createBarSquare(grid, row, col);
    }
  }

  // Add bar buttons for across clues
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      createAcrossBarButton(grid, row, col);
      createDownBarButton(grid, row, col);
    }
  }

  // Add shade square buttons
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      createShadeSquareSquare(grid, row, col);
      createShadeSquareButton(grid, row, col);
    }
  }

  // Add shade circle buttons
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      createShadeCircleSquare(grid, row, col);
      createShadeCircleButton(grid, row, col);
    }
  }

  // Add circle squares
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      createCircleSquare(grid, row, col);
      createCircleButton(grid, row, col);
    }
  }

}

function setAcrossBar(div) {
  var id = div.id.split("-");
  var row = parseInt(id[2]);
  var col = parseInt(id[3]);
  var barsquare1 = "barsquare-" + row + "-" + col;
  var barsquare2 = "barsquare-" + row + "-" + (col+1);
  console.log("Setting Across Bar: " + barsquare1 + " / " + barsquare2)
  var div1 = document.getElementById(barsquare1);
  var div2 = document.getElementById(barsquare2);
  div1.classList.toggle("grid__bar--right");
  div2.classList.toggle("grid__bar--left");
}

function setDownBar(div) {
  var id = div.id.split("-");
  var row = parseInt(id[2]);
  var col = parseInt(id[3]);
  var barsquare1 = "barsquare-" + row + "-" + col;
  var barsquare2 = "barsquare-" + (row+1) + "-" + col;
  console.log("Setting Down Bar: " + barsquare1 + " / " + barsquare2)
  var div1 = document.getElementById(barsquare1);
  var div2 = document.getElementById(barsquare2);
  div1.classList.toggle("grid__bar--bottom");
  div2.classList.toggle("grid__bar--top");
}

function setCircle(div) {
  var id = div.id.split("-");
  console.log(div);
  var row = parseInt(id[2]);
  var col = parseInt(id[3]);
  var circle = "circle-" + row + "-" + col;
  var div = document.getElementById(circle);
  console.log("Toggling Circle: " + circle);
  div.classList.toggle("grid__circle__button--selected");
}

function setShadeCircle(div) {
  var id = div.id.split("-");
  var row = parseInt(id[2]);
  var col = parseInt(id[3]);
  var shadecircle = "shadecircle-" + row + "-" + col;
  var div = document.getElementById(shadecircle);
  console.log("Toggling Shade Circle: " + shadecircle);
  div.classList.toggle("grid__shadecircle__button--selected");
}

function setShadeSquare(div) {
  var id = div.id.split("-");
  var row = parseInt(id[2]);
  var col = parseInt(id[3]);
  var shadesquare = "shadesquare-" + row + "-" + col;
  var div = document.getElementById(shadesquare);
  console.log("Toggling Shade Square: " + shadesquare);
  div.classList.toggle("grid__shadesquare__button--selected");
}

function setGridSize(select) {
  // get the grid size from the select selection
  var grid_size = select.options[select.selectedIndex].id.split("x");
  var cols = grid_size[0];
  var rows = grid_size[1];
  console.log("Setting Grid Size: " + rows + " rows, " + cols + " cols")

  // update the width and depth inputs to match the selection
  document.getElementById("width").value = cols;
  document.getElementById("depth").value = rows;

  // reset the select element
  select.selectedIndex = 0;

  // redraw the grid with the new size
  createEmptyGrid(cols, rows);
}

function blurInput(input) {
  input.style.backgroundColor = "transparent";
}

function focusInput(input) {
  input.style.backgroundColor = "#ffff00";
}

function hideGridSizeControls() {
  var grid_size = document.getElementById("grid-size-control-container");
  var grid_toolbar = document.getElementById("grid-toolbar");
  console.log("Hiding Grid Size controls")
  grid_size.classList.toggle("hidden");
  grid_toolbar.classList.toggle("hidden");
}

function toggleTool(div) {
  if (div.classList.contains("grid__toolbar__item--selected")) {
    // console.log("Disabling Tool: " + div.id);
    div.classList.remove("grid__toolbar__item--selected");
    disableTool(div);

  } else {
    // console.log("Enabling Tool: " + div.id);
    var toolbar_items = document.getElementsByClassName("grid__toolbar__item__wrapper");
    for (item of toolbar_items) {
      if (item.id != div.id && item.classList.contains("grid__toolbar__item--selected")){
        disableTool(item);
      }
    }
    div.classList.add("grid__toolbar__item--selected");
    enableTool(div);

  }
}

function disableTool(div) {
  if (div.id == "answer-tool") {
    disableAnswerTool(div);
  } else if (div.id == "bar-tool") {
    disableBarTool(div);
  } else if (div.id == "index-tool") {
    disableIndexTool(div);
  } else if (div.id == "shade-square-tool") {
    disableShadeSquareTool(div);
  } else if (div.id == "shade-circle-tool") {
    disableShadeCircleTool(div);
  } else if (div.id == "circle-tool") {
    disableCircleTool(div);
  }
}

function disableAnswerTool(div) {
  console.log("Disabling the Answer Tool");
  div.classList.remove("grid__toolbar__item--selected");
  var answers = document.getElementsByClassName("grid__answer__input");
  for (answer of answers) {
    answer.classList.add("hidden");
  }
}

function disableBarTool(div) {
  console.log("Disabling the Bar Tool");
  div.classList.remove("grid__toolbar__item--selected");
  var bar_buttons = document.getElementsByClassName("grid__bar__button");
  for (button of bar_buttons) {
    button.classList.add("hidden");
  }
}

function disableIndexTool(div) {
  console.log("Disabling the Shade Square Tool");
  div.classList.remove("grid__toolbar__item--selected");
  var buttons = document.getElementsByClassName("grid__index__button");
  for (button of buttons) {
    button.classList.add("hidden");
  }
}

function disableShadeSquareTool(div) {
  console.log("Disabling the Shade Square Tool");
  div.classList.remove("grid__toolbar__item--selected");
  var buttons = document.getElementsByClassName("grid__shadesquare__button");
  for (button of buttons) {
    button.classList.add("hidden");
  }
}

function disableShadeCircleTool(div) {
  console.log("Disabling the Shade Circle Tool");
  div.classList.remove("grid__toolbar__item--selected");
  var buttons = document.getElementsByClassName("grid__shadecircle__button");
  for (button of buttons) {
    button.classList.add("hidden");
  }
}

function disableCircleTool(div) {
  console.log("Disabling the Circle Tool");
  div.classList.remove("grid__toolbar__item--selected");
  var buttons = document.getElementsByClassName("grid__circle__button");
  for (button of buttons) {
    button.classList.add("hidden");
  }
}

function enableTool(div) {
  if (div.id == "answer-tool") {
    enableAnswerTool(div);
  } else if (div.id == "bar-tool") {
    enableBarTool(div);
  } else if (div.id == "index-tool") {
    enableIndexTool(div);
  } else if (div.id == "shade-square-tool") {
    enableShadeSquareTool(div);
  } else if (div.id == "shade-circle-tool") {
    enableShadeCircleTool(div);
  } else if (div.id == "circle-tool") {
    enableCircleTool(div);
  }
}

function enableAnswerTool(div) {
  console.log("Enabling Answer Tool");
}

function enableBarTool(div) {
  console.log("Enabling Bar Tool");
  var bar_buttons = document.getElementsByClassName("grid__bar__button");
  for (button of bar_buttons) {
    button.classList.remove("hidden");
  }
}

function enableIndexTool(div) {
  console.log("Enabling Index Tool");
}

function enableShadeSquareTool(div) {
  console.log("Enabling Shade Square Tool");
  var shadesquares = document.getElementsByClassName("grid__shadesquare__button");
  for (shadesquare of shadesquares) {
    shadesquare.classList.remove("hidden");
  }
}

function enableShadeCircleTool(div) {
  console.log("Enabling Shade Circle Tool");
  var shadecircles = document.getElementsByClassName("grid__shadecircle__button");
  for (shadecircle of shadecircles) {
    shadecircle.classList.remove("hidden");
  }
}

function enableCircleTool(div) {
  console.log("Enabling Circle Tool");
  var circles = document.getElementsByClassName("grid__circle__button");
  for (circle of circles) {
    circle.classList.remove("hidden");
  }
}

// Bar Layer
function toggleBarLayer(input) {
  if (input.checked) {
    console.log("Enabling Layer: Bars");
    showBars();
  } else {
    console.log("Disabling Layer: Bars");
    hideBars();
  }
}

function hideBars() {
  console.log("Hiding all Bars");
  var bar_squares = document.getElementsByClassName("grid__bar__square");
  for (square of bar_squares) {
    square.classList.add("hidden");
  }
}

function showBars() {
  console.log("Showing all Bars");
  var bar_squares = document.getElementsByClassName("grid__bar__square");
  for (square of bar_squares) {
    square.classList.remove("hidden");
  }
}

// Circle Layer
function toggleCircleLayer(input) {
  if (input.checked) {
    console.log("Enabling Layer: Circles");
    showCircles();
  } else {
    console.log("Disabling Layer: Circles");
    hideCircles();
  }
}

function hideCircles() {
  console.log("Hiding all Circles");
  var circle_squares = document.getElementsByClassName("grid__circle__square");
  for (square of circle_squares) {
    square.classList.add("hidden");
  }
}

function showCircles() {
  console.log("Showing all Circles");
  var circle_squares = document.getElementsByClassName("grid__circle__square");
  for (square of circle_squares) {
    square.classList.remove("hidden");
  }
}

// Shade Circle Layer
function toggleShadeCircleLayer(input) {
  if (input.checked) {
    console.log("Enabling Layer: Shade Circles");
    showShadeCircles();
  } else {
    console.log("Disabling Layer: Shade Circles");
    hideShadeCircles();
  }
}

function showShadeCircles() {
  console.log("Showing all Shade Circles");
  var shadecirecle_squares = document.getElementsByClassName("grid__shadecircle__square");
  for (square of shadecirecle_squares) {
    square.classList.remove("hidden");
  }
}

function hideShadeCircles() {
  console.log("Hiding all Shade Circles");
  var shadecirecle_squares = document.getElementsByClassName("grid__shadecircle__square");
  for (square of shadecirecle_squares) {
    square.classList.add("hidden");
  }
}

// Shade Square Layer
function toggleShadeSquareLayer(input) {
  if (input.checked) {
    console.log("Enabling Layer: Shade Squares");
    showShadeSquares();
  } else {
    console.log("Disabling Layer: Shade Squares");
    hideShadeSquares();
  }
}

function showShadeSquares() {
  console.log("Showing all Shade Squares");
  var shadesquare_squares = document.getElementsByClassName("grid__shadesquare__square");
  for (square of shadesquare_squares) {
    square.classList.remove("hidden");
  }
}

function hideShadeSquares() {
  console.log("Hiding all Shade Squares");
  var shadesquare_squares = document.getElementsByClassName("grid__shadesquare__square");
  for (square of shadesquare_squares) {
    square.classList.add("hidden");
  }
}

