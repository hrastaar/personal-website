
function hello() {
    console.log(this);
}

const x = 6 % 2;
const y = x ? 'One' : 'Two';
console.log(y)