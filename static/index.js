
async function loginUser(){
const username = $("#username").val();
const password = $("#password").val();
let response = await axios.post("localhost:300/auth/login", {username, password});


}