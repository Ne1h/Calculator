/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const calculator = document.querySelector('.calculator') as HTMLDivElement;
const display = document.getElementById('display') as HTMLInputElement;
const keys = calculator.querySelector('.calculator-keys') as HTMLDivElement;

let firstValue = '';
let operator: string | null = null;
let waitingForSecondValue = false;
let previousKeyType: string | null = 'clear'; // Initialize with a type

function calculate(n1: string, op: string, n2: string): number {
    const num1 = parseFloat(n1);
    const num2 = parseFloat(n2);
    if (op === 'add') return num1 + num2;
    if (op === 'subtract') return num1 - num2;
    if (op === 'multiply') return num1 * num2;
    if (op === 'divide') {
        if (num2 === 0) return NaN; // Indicate division by zero
        return num1 / num2;
    }
    // Should not happen with valid operators
    console.error("Invalid operator in calculate:", op);
    return num2; 
}

function inputDigit(digit: string): void {
    // If previous action was calculate or operator, or display is '0' (unless it's '0.' already), start new number.
    if (waitingForSecondValue || previousKeyType === 'calculate' || previousKeyType === 'operator') {
        display.value = digit;
        // If an operator was just pressed (previousKeyType === 'operator'),
        // firstValue and operator are set. Now we're inputting the second value.
        // waitingForSecondValue was true, now it becomes false as we start the second number.
        waitingForSecondValue = false;
    } else {
      // Allow appending if display is "0" and digit is not "0", or if display is not "0"
      display.value = display.value === '0' ? digit : display.value + digit;
    }
    previousKeyType = 'number';
}

function inputDecimal(dot: string): void {
    // If an operator was just pressed or calculation just happened, start new number with "0."
    if (waitingForSecondValue || previousKeyType === 'operator' || previousKeyType === 'calculate') {
        display.value = '0.';
        waitingForSecondValue = false; // Starting new (second) number
    } else if (!display.value.includes(dot)) {
        display.value += dot;
    }
    previousKeyType = 'decimal';
}

function handleOperator(nextOperator: string): void {
    const inputValue = display.value;

    // If user presses op1, then op2 without a number in between (e.g. 5 + - 3)
    if (operator && waitingForSecondValue) {
        operator = nextOperator; // Change the operator
        previousKeyType = 'operator';
        return;
    }

    // If firstValue is not set, set it. (e.g. 5 + ...)
    if (firstValue === '' || operator === null) { // operator === null handles chaining correctly after equals
        firstValue = inputValue;
    } else { // Already have firstValue and an operator, so calculate
        const result = calculate(firstValue, operator, inputValue);
        if (isNaN(result)) {
            display.value = 'Error';
            internalFullResetOnError();
            previousKeyType = 'error';
            return;
        }
        const resultString = String(parseFloat(result.toFixed(10)));
        display.value = resultString;
        firstValue = resultString; // Result of calculation becomes new firstValue
    }

    waitingForSecondValue = true; // Ready for the second number
    operator = nextOperator;
    previousKeyType = 'operator';
}

function internalFullReset(): void {
    firstValue = '';
    operator = null;
    waitingForSecondValue = false;
    // previousKeyType will be set by the action calling this (e.g. all-clear)
}

function internalFullResetOnError(): void {
    // Keep 'Error' on display, but reset internal state for next valid input
    firstValue = '';
    operator = null;
    waitingForSecondValue = false;
}


function allClearAction(): void {
    display.value = '0';
    internalFullReset();
    previousKeyType = 'all-clear';
}

function clearEntryAction(): void {
    if (previousKeyType === 'calculate' || display.value === 'Error') {
        allClearAction(); // If after equals or error, C behaves like AC
        // previousKeyType is already set by allClearAction
        return;
    }

    // If an operator was just pressed (display shows firstValue, waiting for second value).
    // Pressing C should clear display to '0' to allow re-entry of second value.
    if (previousKeyType === 'operator' && waitingForSecondValue) {
        display.value = '0';
        // firstValue, operator, waitingForSecondValue remain as they are.
        // User can now type the second number.
    } else {
        // Standard backspace behavior for the current number being typed
        if (display.value.length > 1) {
            display.value = display.value.slice(0, -1);
        } else {
            display.value = '0';
        }
    }
    previousKeyType = 'clear-entry';
}


keys.addEventListener('click', (event) => {
    const target = event.target as HTMLButtonElement;
    if (!target.matches('button')) {
        return;
    }

    const value = target.value;
    const action = target.dataset.action;

    performAction(value, action);
});

function performAction(valueAttribute: string | undefined, dataAction: string | undefined): void {
    if (display.value === 'Error' && dataAction !== 'all-clear' && dataAction !== 'clear-entry') {
        // If display is "Error", only allow AC or C.
        // C will behave like AC in this case.
        if (dataAction === 'clear-entry') {
            allClearAction();
        }
        return;
    }


    if (!dataAction && valueAttribute) { // Number button
        inputDigit(valueAttribute);
    } else if (
        dataAction === 'add' ||
        dataAction === 'subtract' ||
        dataAction === 'multiply' ||
        dataAction === 'divide'
    ) {
        handleOperator(dataAction);
    } else if (dataAction === 'decimal') {
        inputDecimal('.');
    } else if (dataAction === 'all-clear') {
        allClearAction();
    } else if (dataAction === 'clear-entry') {
        clearEntryAction();
    } else if (dataAction === 'calculate') {
        if (firstValue && operator && !waitingForSecondValue) { // Ensure second value has been (at least partially) entered
            const currentValue = display.value;
            const result = calculate(firstValue, operator, currentValue);

            if (isNaN(result)) {
                display.value = 'Error';
                internalFullResetOnError();
                previousKeyType = 'error';
            } else {
                const resultString = String(parseFloat(result.toFixed(10)));
                display.value = resultString;
                firstValue = resultString; // Result for chaining
                operator = null; // Reset operator
                waitingForSecondValue = false; // Ready for new first number or operator
                previousKeyType = 'calculate';
            }
        } else if (operator && waitingForSecondValue && firstValue) {
            // Case: 5 + = (use firstValue as secondValue)
            const result = calculate(firstValue, operator, firstValue);
            if (isNaN(result)) {
                display.value = 'Error';
                internalFullResetOnError();
                previousKeyType = 'error';
            } else {
                const resultString = String(parseFloat(result.toFixed(10)));
                display.value = resultString;
                firstValue = resultString;
                operator = null;
                waitingForSecondValue = false;
                previousKeyType = 'calculate';
            }
        }
        // If not enough info, do nothing on '='
    }
}

document.addEventListener('keydown', (event) => {
    let targetButton: HTMLButtonElement | null = null;
    const key = event.key;

    if (key >= '0' && key <= '9') {
        targetButton = keys.querySelector(`button[value="${key}"]`) as HTMLButtonElement;
    } else if (key === '.') {
        targetButton = keys.querySelector('button[data-action="decimal"]') as HTMLButtonElement;
    } else if (key === '+') {
        targetButton = keys.querySelector('button[data-action="add"]') as HTMLButtonElement;
    } else if (key === '-') {
        targetButton = keys.querySelector('button[data-action="subtract"]') as HTMLButtonElement;
    } else if (key === '*') {
        targetButton = keys.querySelector('button[data-action="multiply"]') as HTMLButtonElement;
    } else if (key === '/') {
        targetButton = keys.querySelector('button[data-action="divide"]') as HTMLButtonElement;
        event.preventDefault(); // Prevent browser's default find action
    } else if (key === 'Enter' || key === '=') {
        targetButton = keys.querySelector('button[data-action="calculate"]') as HTMLButtonElement;
        event.preventDefault(); // Prevent default form submission if any
    } else if (key === 'Escape') {
        targetButton = keys.querySelector('button[data-action="all-clear"]') as HTMLButtonElement;
    } else if (key.toLowerCase() === 'c' || key === 'Backspace') {
        targetButton = keys.querySelector('button[data-action="clear-entry"]') as HTMLButtonElement;
        if (key === 'Backspace') {
            event.preventDefault(); // Prevent navigating back
        }
    }


    if (targetButton) {
        targetButton.click();
        targetButton.classList.add('key-active-kb');
        setTimeout(() => {
            targetButton?.classList.remove('key-active-kb');
        }, 100);
    }
});


// Initial display
allClearAction(); // Initialize calculator state and display '0'
