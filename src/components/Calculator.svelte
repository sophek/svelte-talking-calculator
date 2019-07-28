<script>
  import { onMount } from "svelte";
  import formatMoney from "accounting-js/lib/formatMoney.js";

  //TextToSpeech.talk("Hello Beautiful World!");
  let previous = null;
  let display = 0;
  let operator = null;
  let operatorClicked = false;
  let decimalCount = 0;

  const keys = [
    "AC",
    "+/-",
    "%",
    "÷",
    7,
    8,
    9,
    "x",
    4,
    5,
    6,
    "-",
    1,
    2,
    3,
    "+",
    0,
    ".",
    "C",
    "="
  ];

  const sign = () => {
    display =
      display < 0
        ? (display = display - display * 2)
        : (display = display - display * 2);
  };

  const percent = () => {
    display = display / 100;
  };

  const append = number => () => {
    //sayIt(number);

    //Check if there is a decimal, if so increase the decimal count
    if (display.toString().indexOf(".") > -1) {
      decimalCount += 1;
    }
    //If there is a decimal and the next number is a decimal just return true
    if (decimalCount > 1 && number === ".") {
      return;
    }

    if (operatorClicked === true) {
      display = "";
      operatorClicked = false;
    }
    display = display === 0 ? (display = number) : "" + display + number;
    console.log("operatorClicked", operatorClicked);
  };

  const functionFactory = func => () => {
    sayIt(formatMoney(display));
    let operatorAction = "";
    switch (func) {
      case "AC":
        operatorAction = clear();
        break;
      case "+":
        operatorAction = add();
        sayIt("plus");
        break;
      case "x":
        operatorAction = multiply();
        sayIt("times");
        break;
      case "÷":
        operatorAction = divide();
        sayIt("divide by");
        break;
      case "-":
        operatorAction = subtract();
        sayIt("subtract");
        break;
      case "=":
        sayIt("equal");
        operatorAction = equal();
        break;
      case "C":
        sayIt("clear");
        operatorAction = clear();
        break;
      case "%":
        sayIt("percent");
        operatorAction = percent();
        break;
      case "+/-":
        operatorAction = sign();
        break;
      default:
        operatorAction = "";
    }
    if (operatorAction !== "") {
      decimalCount = 0;
    }
    return operatorAction;
  };

  const decimal = () => {
    if (display.indexOf(".") === -1) {
      append(".");
    }
  };

  const divide = () => {
    operator = (a, b) => a / b;
    previous = display;
    operatorClicked = true;
  };

  const multiply = () => {
    operator = (a, b) => a * b;
    previous = display;
    operatorClicked = true;
  };

  const subtract = () => {
    operator = (a, b) => a - b;
    previous = display;
    operatorClicked = true;
  };

  const add = () => {
    console.log("add");
    operator = (a, b) => a + b;
    previous = display;
    operatorClicked = true;
  };

  const equal = () => {
    console.log("equal");
    display = operator(Number(previous), Number(display));
    sayIt(formatMoney(display));
    previous = null;
    operatorClicked = true;
  };

  const clear = () => (display = "");

  const operatorString = operator => {
    if (operator === ".") {
      return "";
    }
    return isNaN(operator) ? operator : "";
  };

  const sayIt = phrase => {
    if ("speechSynthesis" in window) {
      var msg = new SpeechSynthesisUtterance(phrase);
      window.speechSynthesis.speak(msg);
    }
  };

  onMount(async () => {
    // const res = await fetch(
    //   `https://jsonplaceholder.typicode.com/photos?_limit=20`
    // );
    // photos = await res.json();
    // console.log(photos);
  });
</script>

<style>
  .keypad {
    display: grid;
    grid-template-columns: repeat(4, 5em);
    grid-template-rows: repeat(5, 3em);
    grid-gap: 0em;
  }

  button {
    margin: 0;
    border-bottom: solid 1px black;
    border-right: solid 1px black;
    border-top: none;
    border-left: none;
    border-radius: 0px;
    height: 2.98em;
    border-color: #000;
  }

  .button.is-warning,
  .button.is-primary {
    border-color: #000;
  }

  .calculator {
    width: 500px;
    margin-top: 100px;
  }

  .display {
    width: 320px;
    margin-top: -27px;
    position: absolute;
    font-size: 1.5rem;
    border: solid 1px #000;
    height: 50px;
    padding: 10px;
  }
</style>

<div class="columns calculator">
  <div class="column">
    <div class="columns">
      <div class="column">
        <h1 class="display">{display}</h1>
      </div>
    </div>
    <div class="columns">
      <div class="column">
        <div class="keypad">
          {#each keys as key}
            <button
              class={operatorString(key) === '' ? 'button is-primary' : 'button is-warning'}
              on:click={operatorString(key) === '' ? append(key) : functionFactory(key)}>
              {key}
            </button>
          {/each}
        </div>
      </div>
    </div>
  </div>

</div>
