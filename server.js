const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 3000;
const API_KEY = 'https://www.googleapis.com/books/v1/volumes?q=harry+potter&callback=handleResponse'; // Replace with an actual API key

app.use(express.json());

// Middleware for API key authorization
const authorize = (req, res, next) => {
  const key = req.headers['api-key'];
  if (key !== API_KEY) return res.status(403).json({ message: 'Forbidden: Invalid API Key' });
  next();
};

// Load books data
const loadBooks = () => {
  const data = fs.readFileSync('./books.json', 'utf8');
  return JSON.parse(data);
};

// Save books data
const saveBooks = (books) => {
  fs.writeFileSync('./books.json', JSON.stringify(books, null, 2));
};

// GET all books or a specific book by ISBN
app.get('/books/:isbn?', authorize, (req, res) => {
  const books = loadBooks();
  const { isbn } = req.params;
  if (isbn) {
    const book = books.find((b) => b.ISBN === isbn);
    return book ? res.json(book) : res.status(404).json({ message: 'Book not found' });
  }
  res.json(books);
});

// POST a new book
app.post('/books', authorize, (req, res) => {
  const { title, author, publisher, publishedDate, ISBN } = req.body;
  if (!title || !author || !ISBN) return res.status(400).json({ message: 'Title, Author, and ISBN are required' });
  
  const books = loadBooks();
  if (books.some((b) => b.ISBN === ISBN)) return res.status(400).json({ message: 'Book already exists' });

  const newBook = { title, author, publisher, publishedDate, ISBN };
  books.push(newBook);
  saveBooks(books);
  res.status(201).json(newBook);
});

// PUT/PATCH update book by ISBN
app.put('/books/:isbn', authorize, (req, res) => {
  const { isbn } = req.params;
  const { title, author, publisher, publishedDate } = req.body;

  const books = loadBooks();
  const book = books.find((b) => b.ISBN === isbn);
  if (!book) return res.status(404).json({ message: 'Book not found' });

  book.title = title || book.title;
  book.author = author || book.author;
  book.publisher = publisher || book.publisher;
  book.publishedDate = publishedDate || book.publishedDate;

  saveBooks(books);
  res.json(book);
});

// DELETE a book by ISBN
app.delete('/books/:isbn', authorize, (req, res) => {
  const { isbn } = req.params;
  let books = loadBooks();

  if (!books.some((b) => b.ISBN === isbn)) return res.status(404).json({ message: 'Book not found' });
  books = books.filter((b) => b.ISBN !== isbn);
  saveBooks(books);

  res.status(204).end();
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
