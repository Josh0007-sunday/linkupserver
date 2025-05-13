const Article = require("../models/article");
const User = require("../models/user");

const createArticle = async (req, res) => {
    try {
        const { title, content, excerpt, tags, category, isPublished, coverImage } = req.body;
        const author = req.user?._id;

        if (!author) {
            console.error('No user ID in request');
            return res.status(401).json({ error: 'Authentication failed: No user ID' });
        }

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        // Generate slug from title if not provided
        const slug = req.body.slug || title.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        const newArticle = new Article({
            title,
            slug, // Include the generated slug
            content,
            excerpt,
            tags,
            category,
            author,
            isPublished: isPublished || false,
            ...(isPublished && { publishedAt: new Date() }),
            ...(coverImage && { coverImage }),
        });

        const savedArticle = await newArticle.save();

        const userUpdate = await User.findByIdAndUpdate(
            author,
            { $push: { articles: savedArticle._id } },
            { new: true }
        );
        if (!userUpdate) {
            console.error('User not found for ID:', author);
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(201).json(savedArticle);
    } catch (error) {
        console.error('Error creating article:', error.message, error.stack);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        res.status(500).json({ error: 'Server error while creating article' });
    }
};

const getAllArticles = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const articles = await Article.find({ isPublished: true })
            .sort({ publishedAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("author", "name img")
            .lean();

        const totalArticles = await Article.countDocuments({ isPublished: true });

        res.json({
            articles,
            currentPage: page,
            totalPages: Math.ceil(totalArticles / limit),
            totalArticles
        });
    } catch (error) {
        console.error("Error fetching articles:", error);
        res.status(500).json({ error: "Server error while fetching articles" });
    }
};

const getArticleById = async (req, res) => {
    try {
        const article = await Article.findById(req.params.id)
            .populate("author", "name img bio")
            .populate("collaborators", "name img")
            .populate("comments.user", "name img") // Add this line
            .lean();

        if (!article) {
            return res.status(404).json({ error: "Article not found" });
        }

        if (article.isPublished) {
            await Article.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
        }

        res.json(article);
    } catch (error) {
        console.error("Error fetching article:", error);
        res.status(500).json({ error: "Server error while fetching article" });
    }
};

const updateArticle = async (req, res) => {
    try {
        const { title, content, excerpt, tags, category, isPublished, slug } = req.body;
        const articleId = req.params.id;
        const userId = req.user._id;

        const article = await Article.findById(articleId);
        if (!article) {
            return res.status(404).json({ error: "Article not found" });
        }

        const isAuthor = article.author.equals(userId);
        const isCollaborator = article.collaborators.some(collab => collab.equals(userId));

        if (!isAuthor && !isCollaborator && req.user.role !== "admin") {
            return res.status(403).json({ error: "Not authorized to update this article" });
        }

        article.title = title || article.title;
        article.slug = slug || article.slug || title.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        article.content = content || article.content;
        article.excerpt = excerpt || article.excerpt;
        article.tags = tags || article.tags;
        article.category = category || article.category;
        article.lastEditedAt = new Date();

        if (isPublished !== undefined && isPublished !== article.isPublished) {
            article.isPublished = isPublished;
            article.publishedAt = isPublished ? new Date() : null;
        }

        const updatedArticle = await article.save();
        res.json(updatedArticle);
    } catch (error) {
        console.error("Error updating article:", error);
        res.status(500).json({ error: "Server error while updating article" });
    }
};

const deleteArticle = async (req, res) => {
    try {
        const articleId = req.params.id;
        const userId = req.user._id;

        const article = await Article.findById(articleId);
        if (!article) {
            return res.status(404).json({ error: "Article not found" });
        }

        if (!article.author.equals(userId) && req.user.role !== "admin") {
            return res.status(403).json({ error: "Not authorized to delete this article" });
        }

        await article.deleteOne();

        await User.findByIdAndUpdate(userId, {
            $pull: { articles: articleId }
        });

        res.json({ message: "Article deleted successfully" });
    } catch (error) {
        console.error("Error deleting article:", error);
        res.status(500).json({ error: "Server error while deleting article" });
    }
};

const toggleLikeArticle = async (req, res) => {
    try {
        const articleId = req.params.id;
        const userId = req.user._id;

        const article = await Article.findById(articleId);
        if (!article) {
            return res.status(404).json({ error: "Article not found" });
        }

        const isLiked = article.likes.includes(userId);

        if (isLiked) {
            await Article.findByIdAndUpdate(articleId, {
                $pull: { likes: userId },
                $inc: { likesCount: -1 }
            });
        } else {
            await Article.findByIdAndUpdate(articleId, {
                $addToSet: { likes: userId },
                $inc: { likesCount: 1 }
            });
        }

        res.json({ isLiked: !isLiked });
    } catch (error) {
        console.error("Error toggling like:", error);
        res.status(500).json({ error: "Server error while toggling like" });
    }
};

const addComment = async (req, res) => {
    try {
        const { content } = req.body;
        const articleId = req.params.id;
        const userId = req.user._id;

        if (!content) {
            return res.status(400).json({ error: "Comment content is required" });
        }

        const comment = {
            user: userId,
            content,
            createdAt: new Date()
        };

        const updatedArticle = await Article.findByIdAndUpdate(
            articleId,
            { $push: { comments: comment } },
            { new: true }
        ).populate("comments.user", "name img");

        if (!updatedArticle) {
            return res.status(404).json({ error: "Article not found" });
        }

        // Get the newly added comment (it will be the last one in the array)
        const newComment = updatedArticle.comments[updatedArticle.comments.length - 1];
        
        res.json({
            _id: newComment._id,
            content: newComment.content,
            author: {
                _id: newComment.user._id,
                username: newComment.user.name,
                profilePicture: newComment.user.img
            },
            createdAt: newComment.createdAt
        });
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({ error: "Server error while adding comment" });
    }
};

const getArticlesByAuthor = async (req, res) => {
    try {
        const authorId = req.params.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const articles = await Article.find({ author: authorId, isPublished: true })
            .sort({ publishedAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("author", "name img")
            .lean();

        const totalArticles = await Article.countDocuments({
            author: authorId,
            isPublished: true
        });

        res.json({
            articles,
            currentPage: page,
            totalPages: Math.ceil(totalArticles / limit),
            totalArticles
        });
    } catch (error) {
        console.error("Error fetching author articles:", error);
        res.status(500).json({ error: "Server error while fetching author articles" });
    }
};

module.exports = {
    createArticle,
    getAllArticles,
    getArticleById,
    updateArticle,
    deleteArticle,
    toggleLikeArticle,
    addComment,
    getArticlesByAuthor
};