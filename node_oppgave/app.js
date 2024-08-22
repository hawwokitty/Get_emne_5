const readline = require('readline');
const fs = require('fs');
const { stdin: input, stdout: output } = require('process');

const rl = readline.createInterface({ input, output });

// Function to display all notes
function displayNotes(callback) {
  fs.readFile('notes.txt', 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to read notes:', err);
      callback();
      return;
    }

    const notes = data.trim().split('\n').filter(note => note !== '');
    if (notes.length === 0) {
      console.log('No notes found.');
    } else {
      console.log('Current notes:');
      notes.forEach((note, index) => {
        console.log(`${index + 1}: ${note}`);
      });
    }

    callback(notes);
  });
}

// Function to make a new note
function makeNewNote() {
  rl.question('Make a note: ', (answer) => {
    fs.appendFile('notes.txt', `${answer}\n`, (err) => {
      if (err) {
        console.error('Failed to save note:', err);
      } else {
        console.log('Note saved to notes.txt');
      }
      showMenu();
    });
  });
}

// Function to remove a note
function removeNote() {
  displayNotes((notes) => {
    if (notes.length === 0) {
      showMenu();
      return;
    }

    rl.question('Enter the number of the note you want to remove: ', (num) => {
      const noteIndex = parseInt(num) - 1;

      if (isNaN(noteIndex) || noteIndex < 0 || noteIndex >= notes.length) {
        console.log('Invalid note number.');
      } else {
        notes.splice(noteIndex, 1);
        fs.writeFile('notes.txt', notes.join('\n') + '\n', (err) => {
          if (err) {
            console.error('Failed to update notes:', err);
          } else {
            console.log('Note removed successfully.');
          }
        });
      }

      showMenu();
    });
  });
}

// Function to show the menu and handle user choices
function showMenu() {
  console.log('\nMenu:');
  console.log('1. See all notes');
  console.log('2. Make a new note');
  console.log('3. Remove a note');
  console.log('4. Exit');
  
  rl.question('Choose an option: ', (choice) => {
    switch (choice) {
      case '1':
        displayNotes(showMenu);
        break;
      case '2':
        makeNewNote();
        break;
      case '3':
        removeNote();
        break;
      case '4':
        rl.close();
        console.log('Goodbye!');
        break;
      default:
        console.log('Invalid choice. Please choose a valid option.');
        showMenu();
        break;
    }
  });
}

// Start the menu loop
showMenu();
