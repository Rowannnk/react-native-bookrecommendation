import express from "express";
import cloudinary from "../lib/cloudinary.js";
import Book from "../models/Book.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protectRoute, async (req, res) => {
  //only user can create book and add middleware protectRoute
  //before we call this function we have to protect this and check for the authentication in middlwware protectRoute function
  try {
    const { title, caption, rating, image } = req.body;
    if (!image || !title || !caption || !rating)
      return res.status(400).json({ message: "Please provide all fields" });

    //upload image to cloudinary
    const uploadResponse = await cloudinary.uploader.upload(image);
    const imageUrl = uploadResponse.secure_url;

    //save to mongo db
    const newBook = new Book({
      title,
      caption,
      rating,
      image: imageUrl,
      user: req.user._id,
    });
    await newBook.save();
    res.status(201).json(newBook);
  } catch (error) {
    console.log("Error creating book", error);
    res.status(500).json({ message: error.message });
  }
});

//pagination => infinite loading (if there is 1000 books in database ,i don't want to fetch all at once)
router.get("/", protectRoute, async (req, res) => {
  //example call from fronend
  //const response = await fetch("http://localhost:3000/api/books?page=1&limit=5")
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 5;
    const skip = (page - 1) * limit;

    const books = await Book.find()
      .sort({ createdAt: -1 }) //descending order
      .skip(skip) //if page = 3 , skip previous 10 books and start fetching from 11
      .limit(limit)
      .populate("user", "username profileImage"); //get two attributes in user model

    const totalBooks = await Book.countDocuments(); //how many books in our documents
    res.send({
      books,
      currentPage: page,
      totalBooks: totalBooks,
      totalPages: Math.ceil(totalBooks / limit),
    });
  } catch (error) {
    console.log("Error in get all books", error);
    res.status(500).json({ message: "Internal Server error" });
  }
});

//get recommended books by the logged in user
router.get("/user", protectRoute, async (req, res) => {
  try {
    const books = await Book.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(books);
  } catch (error) {
    console.log("Get user book error", error.message);
    res.status(500).json({ message: "Server Error" });
  }
});

router.delete("/:id", protectRoute, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book Not Found" });

    //check if the user is creator of book
    if (book.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    //delete the image from cloudinary as well
    if (book.image && book.image.includes("cloudinary")) {
      try {
        const publicId = book.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (deleteError) {
        console.log("Error deleting image from cloudinary", deleteError);
      }
    }

    await book.deleteOne();
    res.json({ message: "Book Deleted Successfully" });
  } catch (error) {
    console.log("Error in deleting the book", error);
    res.status(500).json({ message: "Internal Server error" });
  }
});

export default router;
