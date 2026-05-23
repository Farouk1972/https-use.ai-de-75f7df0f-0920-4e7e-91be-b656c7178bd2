fetch('https://uew5dlgp3001.workspaces.bit.cloud/lessons/FR')
  .then(res => res.text())
  .then(text => console.log(text.substring(0, 1500)));
