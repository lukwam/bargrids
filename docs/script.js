let puzzle = {
  // Puzzle Title
  title: "Puzzle Title",
  // Puzzle Size
  cols: 8,
  rows: 8,
  // depth: function() {return size * rows},
  // height: function() {return size * rows},
  // width: function() {return size * cols},
  // Puzzle Content
  solutions: [],
  across_bars: [],
  down_bars: [],
  shade_squares: [],
  shade_circles: [],
  circles: [],
}

function createSquare(grid, row, col) {
  square = document.createElement("div");
  square.id = "square-" + row + "-" + col;
  square.classList.add("grid__square");
  square.style["grid-column"] = (col*2+1) + "/" + (col*2+3);
  square.style["grid-row"] = (row*2+1) + "/" + (row*2+3);
  square.title = "Row: " + (row+1) + ", Column: " + (col+1);
  grid.append(square);
}

function createAnswerInput(grid, row, col) {
  answer = document.createElement("input");
  answer.id = "answer-" + row + "-" + col;
  answer.addEventListener("focusin", (event) => {focusInput(event.target);});
  answer.addEventListener("focusout", (event) => {blurInput(event.target);});
  answer.addEventListener("keyup", (event) => {nextInput(event);updateAnswer(event.target)});
  answer.classList.add("grid__answer__input");
  answer.disabled = true;
  answer.style["grid-column"] = (col*2+1) + "/" + (col*2+3);
  answer.style["grid-row"] = (row*2+1) + "/" + (row*2+3);
  answer.type = "text"
  // answer.minLength = "1"
  answer.maxLength = "1"
  grid.append(answer);
}

function createAcrossBarButton(grid, row, col) {
  across = document.createElement("div");
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

function createIndexInput(grid, row, col) {
  index = document.createElement("input");
  index.id = "index-" + row + "-" + col;
  index.addEventListener("focusin", (event) => {focusInput(event.target)});
  index.addEventListener("focusout", (event) => {blurInput(event.target)});
  index.addEventListener("keyup", (event) => {nextInput(event);updateIndex(event.target)});
  index.disabled = true;
  index.classList.add("grid__index__input");
  index.style["grid-column"] = (col*2+1) + "/" + (col*2+3);
  index.style["grid-row"] = (row*2+1) + "/" + (row*2+3);
  index.type = "text"
  // index.minLength = "1"
  index.maxLength = "2"
  grid.append(index);
}

function createShadeCircleButton(grid, row, col) {
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

function createGrid() {
  var cols = puzzle.cols;
  var rows = puzzle.rows;

  container = document.getElementById("bargrid-container")
  grid = document.getElementById("grid");

  // remove all elements from the grid
  while (grid.firstChild) {
    grid.removeChild(grid.firstChild);
  }
  // remove the grid
  grid.remove();

  grid = document.createElement("div");
  grid.classList.add("grid");
  grid.id = "grid";
  container.appendChild(grid);

  // set the grid size style
  grid.style.width = (50 * cols) + "px";
  grid.style.height = (50 * rows) + "px";

  // set the grid template style
  grid_template = "repeat(" + rows*2 + ", " + (100 / (rows*2)) + "%) / repeat(" + cols*2 + ", " + (100 / (cols*2)) + "%)";
  grid.style["grid-template"] = grid_template;

  // set the grid title
  document.title = puzzle.title;
  title_input = document.getElementById("title")
  title_input.value = puzzle.title;

  // create the grid elements
  createGridElements(rows, cols);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Draw answer
      if (puzzle.solutions[row][col]) {
        drawAnswer(row, col, puzzle.solutions[row][col]);
      }
      // Draw bars
      if (puzzle.across_bars[row].includes(col)) {
        drawAcrossBar(row, col)
      }
      if (puzzle.down_bars[row].includes(col)) {
        drawDownBar(row, col)
      }
      // Draw index
      if (puzzle.indexes[row][col]) {
        drawIndex(row, col, puzzle.indexes[row][col]);
      }
      // Draw shade square
      if (puzzle.shade_squares[row].includes(col)) {
        drawShadeSquare(row, col)
      }
      // Draw shade circle
      if (puzzle.shade_circles[row].includes(col)) {
        drawShadeCircle(row, col)
      }
      // Draw circle
      if (puzzle.circles[row].includes(col)) {
        drawCircle(row, col)
      }

    }
  }

}

function createGridElements(rows, cols) {

  // Add basic squares
  grid.appendChild(document.createComment("Grid Squares"))
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      createSquare(grid, row, col);
    }
  }

  // Add answer squares
  grid.appendChild(document.createComment("Answer Inputs"))
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      createAnswerInput(grid, row, col);
    }
  }

  // Add bar squares
  grid.appendChild(document.createComment("Bar Squares"))
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      createBarSquare(grid, row, col);
    }
  }

  // Add bar buttons for across clues
  grid.appendChild(document.createComment("Across and Down Bar Buttons"))
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      createAcrossBarButton(grid, row, col);
      createDownBarButton(grid, row, col);
    }
  }

  // Add index squares
  grid.appendChild(document.createComment("Index Inputs"))
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      createIndexInput(grid, row, col);
    }
  }

  // Add shade square buttons
  grid.appendChild(document.createComment("Shade Square Square and Button"))
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      createShadeSquareSquare(grid, row, col);
      createShadeSquareButton(grid, row, col);
    }
  }

  // Add shade circle buttons
  grid.appendChild(document.createComment("Shade Circle Squares and Button"))
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      createShadeCircleSquare(grid, row, col);
      createShadeCircleButton(grid, row, col);
    }
  }

  // Add circle squares
  grid.appendChild(document.createComment("Circle Squares and Button"))
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      createCircleSquare(grid, row, col);
      createCircleButton(grid, row, col);
    }
  }
}

function createEmptyGrid(cols, rows) {
  puzzle.cols = cols;
  puzzle.rows = rows;

  puzzle.solutions = [];
  puzzle.indexes = [];
  puzzle.across_bars = [];
  puzzle.down_bars = [];
  puzzle.circles = [];
  puzzle.shade_circles = [];
  puzzle.shade_squares = [];

  for (let row = 0; row < rows; row++) {
    var solution_row = [];
    var index_row = [];
    for (let col = 0; col < cols; col++) {
      solution_row.push("");
      index_row.push("");
    }
    puzzle.solutions.push(solution_row);
    puzzle.indexes.push(index_row);
    puzzle.across_bars.push([]);
    puzzle.across_bars.push([]);
    puzzle.down_bars.push([]);
    puzzle.circles.push([]);
    puzzle.shade_circles.push([]);
    puzzle.shade_squares.push([]);
  }
  console.log(puzzle);

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

  createGridElements(rows, cols);

}

function drawAnswer(row, col, value) {
  var answer_square = "answer-" + row + "-" + col;
  document.getElementById(answer_square).value = value;
}

function drawAcrossBar(row, col) {
  var barsquare_left = "barsquare-" + row + "-" + col;
  var barsquare_right = "barsquare-" + row + "-" + (col+1);
  console.log("Setting Across Bar: " + barsquare_left + " / " + barsquare_right)
  document.getElementById(barsquare_left).classList.toggle("grid__bar--right");
  document.getElementById(barsquare_right).classList.toggle("grid__bar--left");
}

function drawDownBar(row, col) {
  var barsquare_top = "barsquare-" + row + "-" + col;
  var barsquare_bottom = "barsquare-" + (row+1) + "-" + col;
  console.log("Drawing Down Bar: " + barsquare_top + " / " + barsquare_bottom)
  document.getElementById(barsquare_top).classList.toggle("grid__bar--bottom");
  document.getElementById(barsquare_bottom).classList.toggle("grid__bar--top");
}

function drawIndex(row, col, value) {
  var index_square = "index-" + row + "-" + col;
  document.getElementById(index_square).value = value;
}

function drawCircle(row, col) {
  var circle = "circle-" + row + "-" + col;
  document.getElementById(circle).classList.toggle('grid__circle__button--selected');
}

function drawShadeSquare(row, col) {
  var shade_square = "shadesquare-" + row + "-" + col;
  console.log("Drawing Shade Square: " + shade_square);
  document.getElementById(shade_square).classList.toggle('grid__shadesquare__button--selected');
}

function drawShadeCircle(row, col) {
  var shade_circle = "shadecircle-" + row + "-" + col;
  document.getElementById(shade_circle).classList.toggle('grid__shadecircle__button--selected');
}

function setAcrossBar(div) {
  var id = div.id.split("-");
  var row = parseInt(id[2]);
  var col = parseInt(id[3]);
  drawAcrossBar(row, col);

  if (puzzle.across_bars[row].includes(col)) {
    console.log("Disabling Across Bar: " + id);
    // div.classList.remove("grid__bar--right");
    // div.classList.remove("grid__bar--left");
    n = puzzle.across_bars[row].indexOf(col)
    if (n !== -1) {
      puzzle.across_bars[row].splice(n, 1);
    }
  } else {
    console.log("Enabling Across Bar: " + id);
    // div.classList.add("grid__bar--right");
    // div.classList.add("grid__bar--left");
    puzzle.across_bars[row].push(col);
  }
}

function setDownBar(div) {
  var id = div.id.split("-");
  var row = parseInt(id[2]);
  var col = parseInt(id[3]);
  drawDownBar(row, col);

  if (puzzle.down_bars[row].includes(col)) {
    console.log("Disabling Across Bar: " + circle);
    // div.classList.remove("grid__bar--bottom");
    // div.classList.remove("grid__bar--top");
    n = puzzle.down_bars[row].indexOf(col)
    if (n !== -1) {
      puzzle.down_bars[row].splice(n, 1);
    }
  } else {
    console.log("Enabling Across Bar: " + circle);
    // div.classList.add("grid__bar--bottom");
    // div.classList.add("grid__bar--top");
    puzzle.down_bars[row].push(col);
  }
}

function setCircle(div) {
  var id = div.id.split("-");
  console.log(div);
  var row = parseInt(id[2]);
  var col = parseInt(id[3]);
  var circle = "circle-" + row + "-" + col;
  var div = document.getElementById(circle);
  if (puzzle.circles[row].includes(col)) {
    console.log("Disabling Circle: " + circle);
    div.classList.remove("grid__circle__button--selected");
    n = puzzle.circles[row].indexOf(col)
    if (n !== -1) {
      puzzle.circles[row].splice(n, 1);
    }
  } else {
    console.log("Enabling Circle: " + circle);
    div.classList.add("grid__circle__button--selected");
    puzzle.circles[row].push(col);
  }
}

function setShadeCircle(div) {
  var id = div.id.split("-");
  var row = parseInt(id[2]);
  var col = parseInt(id[3]);
  var shadecircle = "shadecircle-" + row + "-" + col;
  var div = document.getElementById(shadecircle);
  if (puzzle.shade_circles[row].includes(col)) {
    console.log("Disabling Shade Circle: " + shadecircle);
    div.classList.remove("grid__shadecircle__button--selected");
    n = puzzle.shade_circles[row].indexOf(col)
    if (n !== -1) {
      puzzle.shade_circles[row].splice(n, 1);
    }
  } else {
    console.log("Enabling Shade Circle: " + shadecircle);
    div.classList.add("grid__shadecircle__button--selected");
    puzzle.shade_circles[row].push(col);
  }
}

function setShadeSquare(div) {
  var id = div.id.split("-");
  var row = parseInt(id[2]);
  var col = parseInt(id[3]);
  var shadesquare = "shadesquare-" + row + "-" + col;
  var div = document.getElementById(shadesquare);
  if (puzzle.shade_squares[row].includes(col)) {
    console.log("Disabling Shade Square: " + shadesquare);
    div.classList.remove("grid__shadesquare__button--selected");
    n = puzzle.shade_squares[row].indexOf(col)
    if (n !== -1) {
      puzzle.shade_squares[row].splice(n, 1);
    }
  } else {
    console.log("Enabling Shade Square: " + shadesquare);
    div.classList.add("grid__shadesquare__button--selected");
    puzzle.shade_squares[row].push(col);
  }
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

function hideGridSizeControls() {
  console.log("Hiding Grid Size controls")
  document.getElementById("grid-size-control-container").classList.add("hidden");
  console.log("Displaying Grid Toolbar and Layers Tool")
  document.getElementById("grid-toolbar").classList.remove("hidden");
  document.getElementById("layers-tool").classList.remove("hidden");
  document.getElementById("downloads-tool").classList.remove("hidden");
  document.getElementById("uploads-tool").classList.add("hidden");
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
    answer.disabled = true;
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
  var inputs = document.getElementsByClassName("grid__index__input");
  for (input of inputs) {
    input.disabled = true;
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
  var inputs = document.getElementsByClassName("grid__answer__input");
  for (input of inputs) {
    input.disabled = false;
  }
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
  var inputs = document.getElementsByClassName("grid__index__input");
  for (input of inputs) {
    input.disabled = false;
  }
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

// Answer Layer
function toggleAnswerLayer(input) {
  if (input.checked) {
    console.log("Enabling Layer: Answers");
    showAnswers();
  } else {
    console.log("Disabling Layer: Answers");
    hideAnswers();
  }
}

function hideAnswers() {
  console.log("Hiding all Answers");
  var inputs = document.getElementsByClassName("grid__answer__input");
  for (input of inputs) {
    input.classList.add("hidden");
  }
}

function showAnswers() {
  console.log("Showing all Answers");
  var inputs = document.getElementsByClassName("grid__answer__input");
  for (input of inputs) {
    input.classList.remove("hidden");
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

// Index Layer
function toggleIndexLayer(input) {
  if (input.checked) {
    console.log("Enabling Layer: Indexs");
    showIndexs();
  } else {
    console.log("Disabling Layer: Indexs");
    hideIndexs();
  }
}

function hideIndexs() {
  console.log("Hiding all Indexs");
  var inputs = document.getElementsByClassName("grid__index__input");
  for (input of inputs) {
    input.classList.add("hidden");
  }
}

function showIndexs() {
  console.log("Showing all Indexs");
  var inputs = document.getElementsByClassName("grid__index__input");
  for (input of inputs) {
    input.classList.remove("hidden");
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

// Input Focus tools
function blurInput(input) {
  input.style.backgroundColor = "transparent";
  console.log("Blur Input: " + input.id)
}

function focusInput(input) {
  input.style.backgroundColor = "#ffff00";
  input.select();
  console.log("Focus Input: " + input.id);
}

function nextInput(event) {
  var key = event.keyCode || event.charCode;
  var input = event.target;
  var id = input.id.split("-");
  if ([8, 37, 38].includes(key)) {
    if (input.previousSibling.focus) {
      input.previousSibling.focus();
    }
  } else if ([39, 40].includes(key)) {
    if (input.nextSibling.focus) {
      input.nextSibling.focus();
    }
  } else if (input.value.length === parseInt(input.attributes["maxlength"].value)) {
    if (input.nextSibling.focus) {
      input.nextSibling.focus();
    }
  }
}

function updateAnswer(input) {
  var answer = input.value.toUpperCase();
  var id = input.id.split("-");
  var row = parseInt(id[1]);
  var col = parseInt(id[2]);
  puzzle.solutions[row][col] = answer;
  console.log("Update Answer: row: " + row + ", col: " + col + ": " + answer);
}

function updateIndex(input) {
  var index = input.value;
  var id = input.id.split("-");
  var row = parseInt(id[1]);
  var col = parseInt(id[2]);
  puzzle.indexes[row][col] = index;
  console.log("Update Index: row: " + row + ", col: " + col + ": " + index);
}

function updateTitle(title) {
  console.log("Updating Title: " + title);
  puzzle.title = title;
  console.log(puzzle);
  console.log(JSON.stringify(puzzle));
}

function updateJsonDownloadLink() {
  var string = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(puzzle));
  var iframe = document.getElementById("download-iframe");
  iframe.setAttribute("href", string);
  iframe.setAttribute("download", puzzle.title + ".json");
  iframe.click();
}

function uploadFile(input) {
  var file = input.files[0];
  var filename = file.name;
  console.log("File Name: " + filename);

  var reader = new FileReader();
  reader.readAsText(file, "UTF-8");
  reader.onload = function (event) {
    puzzle = JSON.parse(event.target.result);
    console.log(puzzle);
    createGrid();
    hideGridSizeControls();
  }
  reader.onerror = function (event) {
      alert("Error reading file: " + filename);
  }
}

function uploadFileButton() {
  var input = document.getElementById("upload-button");
  input.click();
}