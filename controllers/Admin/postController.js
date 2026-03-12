const Post = require("../../models/Post");
const ShoppingPost = require("../../models/ShoppingPost");
const ApiResponse = require("../../utils/ApiResponse");
const ApiError = require("../../utils/ApiError");
const controller = {};

/**
 * Get all posts (with pagination + filters)
 */
controller.getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", includeDeleted = false } = req.query;
    const query = {};

    if (!includeDeleted) query.deletedAt = null;

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    const total = await Post.countDocuments(query);
    const posts = await Post.find(query)
        .populate("creator", "first_name last_name email profilePic")
        .populate("tags", "first_name last_name email profilePic")
        .populate("comments.user", "first_name last_name email profilePic")
        .populate("views.user", "first_name last_name email profilePic")
        .populate("likes", "first_name last_name email profilePic")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));

    return res.status(200).json(
      new ApiResponse(200, {
        posts,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / limit),
        },
      }, "Posts fetched successfully")
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Failed to fetch posts", [error.message]));
  }
};

/**
 * Get single post (with details)
 */
controller.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
        .populate("creator", "first_name last_name email profilePic")
        .populate("tags", "first_name last_name email profilePic")
        .populate("comments.user", "first_name last_name email profilePic")
        .populate("views.user", "first_name last_name email profilePic")
        .populate("likes", "first_name last_name email profilePic")

    if (!post) return res.status(404).json(new ApiError(404, null, "Post not found"));

    return res.status(200).json(new ApiResponse(200, post, "Post fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Failed to fetch post", [error.message]));
  }
};

/**
 * Update post (title/content/tags)
 */
controller.updatePost = async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { title, content, tags },
      { new: true }
    );

    if (!post) return res.status(404).json(new ApiError(404, null, "Post not found"));

    return res.status(200).json(new ApiResponse(200, post, "Post updated successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Failed to update post", [error.message]));
  }
};

/**
 * Soft delete post
 */
controller.softDeletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json(new ApiError(404, null, "Post not found"));

    post.deletedAt = new Date();
    await post.save();

    return res.status(200).json(new ApiResponse(200, null, "Post soft-deleted"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Failed to delete post", [error.message]));
  }
};

/**
 * Restore soft-deleted post
 */
controller.restorePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json(new ApiError(404, null, "Post not found"));

    post.deletedAt = null;
    await post.save();

    return res.status(200).json(new ApiResponse(200, post, "Post restored successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Failed to restore post", [error.message]));
  }
};

// Business Managemet functions
controller.listPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, includeDeleted = false } = req.query;
    const query = includeDeleted === "true" ? {} : { deletedAt: null };

    const posts = await ShoppingPost.find(query)
        .populate("createdBy", "first_name last_name email profilePic")
        .populate("category", "name")
        .populate("comments.user", "first_name last_name profilePic")
        .populate("views", "first_name last_name email profilePic")
        .populate("likes", "first_name last_name email profilePic")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await ShoppingPost.countDocuments(query);

    return res.status(200).json(
      new ApiResponse(200, {
        posts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      }, "Shopping posts fetched successfully")
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Failed to fetch shopping posts", [error.message]));
  }
};

/**
 * Get single post by ID
 */
controller.getPostById = async (req, res) => {
  try {
    const post = await ShoppingPost.findById(req.params.id)
        .populate("createdBy", "first_name last_name email profilePic")
        .populate("category", "name")
        .populate("comments.user", "first_name last_name profilePic")
        .populate("views", "first_name last_name email profilePic")
        .populate("likes", "first_name last_name email profilePic");

    if (!post) {
      return res.status(404).json(new ApiError(404, null, "Shopping post not found"));
    }

    return res.status(200).json(new ApiResponse(200, post, "Shopping post fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Failed to fetch shopping post", [error.message]));
  }
};

/**
 * Soft delete post
 */
controller.softDeletePost = async (req, res) => {
  try {
    const post = await ShoppingPost.findById(req.params.id);
    if (!post) return res.status(404).json(new ApiError(404, null, "Post not found"));

    if (post.deletedAt) {
      return res.status(400).json(new ApiError(400, null, "Post already deleted"));
    }

    post.deletedAt = new Date();
    await post.save();

    return res.status(200).json(new ApiResponse(200, null, "Post soft deleted"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Failed to delete shopping post", [error.message]));
  }
};

/**
 * Restore soft deleted post
 */
controller.restorePost = async (req, res) => {
  try {
    const post = await ShoppingPost.findById(req.params.id);
    if (!post) return res.status(404).json(new ApiError(404, null, "Post not found"));

    if (!post.deletedAt) {
      return res.status(400).json(new ApiError(400, null, "Post is not deleted"));
    }

    post.deletedAt = null;
    await post.save();

    return res.status(200).json(new ApiResponse(200, null, "Post restored successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Failed to restore shopping post", [error.message]));
  }
};

module.exports = controller;
