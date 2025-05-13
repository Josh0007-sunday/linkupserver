const mongoose = require("mongoose");
const { Schema } = mongoose;

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    maxlength: 300
  },
  coverImage: String,
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    enum: ['Technology', 'Business', 'Health', 'Politics', 'Entertainment', 'Sports', 'Other'],
    default: 'Technology'
  },
  readingTime: {
    type: Number,
    default: 0
  },
  wordCount: {
    type: Number,
    default: 0
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  likesCount: {
    type: Number,
    default: 0
  },
  comments: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    replies: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      content: {
        type: String,
        required: true,
        maxlength: 500
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  claps: {
    type: Number,
    default: 0
  },
  bookmarks: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  bookmarksCount: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
  lastEditedAt: Date,
  seoTitle: String,
  seoDescription: String,
  featured: {
    type: Boolean,
    default: false
  },
  collaborators: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  series: {
    type: Schema.Types.ObjectId,
    ref: 'Series'
  },
  seriesOrder: Number,
  draftVersion: {
    type: Schema.Types.ObjectId,
    ref: 'Article'
  },
  isDraft: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

articleSchema.index({ title: 'text', content: 'text', tags: 'text' });
articleSchema.index({ author: 1 });
articleSchema.index({ isPublished: 1, publishedAt: -1 });
articleSchema.index({ likesCount: -1 });
articleSchema.index({ claps: -1 });

articleSchema.virtual('commentsCount').get(function () {
  return this.comments.length;
});

articleSchema.pre('save', async function (next) {
  if (!this.slug || this.isModified('title')) {
    this.slug = this.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    // Ensure slug is unique
    const existingArticle = await this.constructor.findOne({ slug: this.slug });
    if (existingArticle && existingArticle._id.toString() !== this._id.toString()) {
      this.slug = `${this.slug}-${Date.now()}`;
    }
  }

  if (this.isModified('content')) {
    const wordCount = this.content.split(/\s+/).length;
    this.wordCount = wordCount;
    this.readingTime = Math.ceil(wordCount / 200);
  }

  next();
});

const ArticleModel = mongoose.model("Article", articleSchema);
module.exports = ArticleModel;