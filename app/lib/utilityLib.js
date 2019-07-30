let isEmpty = (value) => {
  if (value === null || value === undefined || value === "")
    return true;
  else
    return false;
}

/* Returns true if any property of the object is empty, false otherwise. */
let isObjectEmpty = (object) => {
  for (let property in object) {
    if (isEmpty(object[property]))
      return true;
  }
  return false;
}

let isEmailValid = (email) => {
  let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,4})+$/;
  return email.match(emailRegex) ? true : false;
}

/* Minimum 8 characters which contain only characters,numeric digits, underscore and first character must be a letter */
let isPasswordValid = (password) => {
  let passwordRegex = /^[A-Za-z0-9]\w{7,}$/;
  return password.match(passwordRegex) ? true : false;
}


module.exports = {
  isEmpty: isEmpty,
  isObjectEmpty: isObjectEmpty,
  isEmailValid: isEmailValid,
  isPasswordValid: isPasswordValid
}