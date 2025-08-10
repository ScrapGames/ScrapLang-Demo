class Test {
  decirHola(num) {
    console.log(`Hola! ${num}`)
  }
}

function main(clase) {
  for (let i = 0; i < 10; i++) {
    new clase(i).decirHola()
  }
}

main(Test)