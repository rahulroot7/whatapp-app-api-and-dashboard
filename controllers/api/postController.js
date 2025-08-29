const Post = require("../../models/Post");
const ApiResponse = require("../../utils/ApiResponse");
const ApiError = require("../../utils/ApiError");

/**
 * Helpers
 */
const parseMaybeJSON = (v) => {
  if (v == null) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) return parsed;
      return v.split(",").map((s) => s.trim()).filter(Boolean);
    } catch {
      return v.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
};

const controller = {};

/**
 * Create a public post
 * Accepts multipart/form-data:
 *  - fields: title, content, tags (JSON array or comma-separated)
 *  - files: mediaPost[] (images/videos)
 */
controller.createPost = async (req, res) => {
    try {
        const { title, content, tags } = req.body;

        if (!title) {
        return res.status(400).json(new ApiError(400, null, "Title is required"));
        }
        // handle mediaPost uploads
        let mediaPost = [];
        if (req.files && req.files.length > 0) {
        mediaPost = req.files.map((file) => `uploads/posts/${file.filename}`);
        }
        const parsedTags = parseMaybeJSON(tags);
        const post = await Post.create({
        creator: req.rootUserId,
        title,
        content,
        media: mediaPost,
        tags: parsedTags,
        isPublic: true,
        });
        return res.status(200).json(new ApiResponse(200, post, "Post created successfully"));
    } catch (error) {
        return res.status(500).json(new ApiError(500, "Failed to create post", [error.message]));
    }
};

/**
 * Public feed (exclude soft-deleted)
 */
controller.getPublicFeed = async (req, res) => {
    try {
        const posts = await Post.find({ isPublic: true, deletedAt: null })
        .populate("creator", "first_name last_name profilePic email")
        .populate("tags", "first_name last_name profilePic email")
        .populate("comments.user", "first_name last_name profilePic")
        .populate("likes", "first_name last_name profilePic")
        .populate("views.user", "first_name last_name profilePic")
        .sort({ createdAt: -1 });

        // Optionally add counts + isLiked flag
        const me = req.rootUserId?.toString();
        const data = posts.map((p) => ({
        ...p.toObject(),
        likesCount: p.likes.length,
        commentsCount: p.comments.length,
        viewsCount: p.views.length,
        isLikedByMe: me ? p.likes.map(String).includes(me) : false,
        }));
        return res.status(200).json(new ApiResponse(200, data, "Public feed fetched successfully"));
    } catch (error) {
        return res.status(500).json(new ApiError(500, "Failed to fetch public feed", [error.message]));
    }
};

/**
 * Get single post by id
 */
controller.getPostById = async (req, res) => {
    try {
        const post = await Post.findOne({
        _id: req.params.id,
        deletedAt: null,
        })
        .populate("creator", "first_name last_name profilePic email")
        .populate("tags", "first_name last_name profilePic email")
        .populate("comments.user", "first_name last_name profilePic email")
        .populate("likes", "first_name last_name profilePic")
        .populate("views.user", "first_name last_name profilePic");

        if (!post) {
        return res.status(404).json(new ApiError(404, null, "Post not found"));
        }

        const me = req.rootUserId?.toString();
        const data = {
        ...post.toObject(),
        likesCount: post.likes.length,
        commentsCount: post.comments.length,
        viewsCount: post.views.length,
        isLikedByMe: me ? post.likes.map(String).includes(me) : false,
        };

        return res.status(200).json(new ApiResponse(200, data, "Post fetched successfully"));
    } catch (error) {
        return res.status(500).json(new ApiError(500, "Failed to fetch post", [error.message]));
    }
};

/**
 * Track a unique view
 */
controller.viewPost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).select("views");
        if (!post) return res.status(404).json(new ApiError(404, null, "Post not found"));

        const me = req.rootUserId.toString();
        const alreadyViewed = post.views.some((v) => v.user.toString() === me);

        if (!alreadyViewed) {
            post.views.push({ user: req.rootUserId });
            await post.save();
        }

        return res.status(200).json(new ApiResponse(200, { viewsCount: post.views.length }, "View recorded"));
    } catch (error) {
        return res.status(500).json(new ApiError(500, "Failed to track view", [error.message]));
    }
};

/**
 * Like / Unlike
 */
controller.toggleLike = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).select("likes");
        if (!post) return res.status(404).json(new ApiError(404, null, "Post not found"));

        const me = req.rootUserId.toString();
        const hasLiked = post.likes.map(String).includes(me);

        if (hasLiked) {
        post.likes.pull(req.rootUserId);
        } else {
        post.likes.push(req.rootUserId);
        }

        await post.save();

        return res.status(200).json(
        new ApiResponse(200, { liked: !hasLiked, likesCount: post.likes.length }, "Like state updated")
        );
    } catch (error) {
        return res.status(500).json(new ApiError(500, "Failed to like/unlike post", [error.message]));
    }
};

/**
 * Comment
 */
controller.addComment = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || !text.trim()) {
        return res.status(400).json(new ApiError(400, null, "Comment text is required"));
        }

        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json(new ApiError(404, null, "Post not found"));

        post.comments.push({ user: req.rootUserId, text: text.trim() });
        await post.save();

        // return latest comment populated
        const populated = await Post.findById(req.params.id)
        .select("comments")
        .populate("comments.user", "first_name last_name profilePic");

        const lastComment = populated.comments[populated.comments.length - 1];

        return res
        .status(200)
        .json(new ApiResponse(200, lastComment, "Comment added"));
    } catch (error) {
        return res.status(500).json(new ApiError(500, "Failed to add comment", [error.message]));
    }
};

/**
 * Soft delete
 */
controller.deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).select("creator deletedAt");
        if (!post) return res.status(404).json(new ApiError(404, null, "Post not found"));

        // Only creator (or admin, if you add role checks) can delete
        if (post.creator.toString() !== req.rootUserId.toString()) {
        return res.status(403).json(new ApiError(403, null, "Not authorized to delete this post"));
        }

        post.deletedAt = new Date();
        await post.save();

        return res.status(200).json(new ApiResponse(200, null, "Post deleted"));
    } catch (error) {
        return res.status(500).json(new ApiError(500, "Failed to delete post", [error.message]));
    }
};

module.exports = controller;
