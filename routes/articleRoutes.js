const express = require("express");
   const router = express.Router();
   const auth = require("../middleware/authMiddleware");
//    const multer = require('multer');
   const {
       createArticle,
       getAllArticles,
       getArticleById,
       updateArticle,
       deleteArticle,
       toggleLikeArticle,
       addComment,
       getArticlesByAuthor
   } = require("../controllers/articleCotroller");


   router.get("/getallarticle", getAllArticles);
   router.get("/getallarticle/:id", getArticleById);
   router.get("/author/:userId", getArticlesByAuthor);
   router.post("/create-article", auth, createArticle);
   router.put("/update-article/:id", auth, updateArticle);
   router.delete("/delete-article/:id", auth, deleteArticle);
   router.post("/:id/like", auth, toggleLikeArticle);
   router.post("/:id/comments", auth, addComment);

   module.exports = router;