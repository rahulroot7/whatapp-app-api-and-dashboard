// controllers/shoppingPostController.js
const controller = {};
const ShoppingPost = require("../../models/ShoppingPost");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");

controller.createPost = async (req, res) => {
  try {
    const { title, description, price, category } = req.body;

    if (!title || !price || !category) {
      return res.status(400).json(new ApiError(400, null, "Title, price & category are required"));
    }

    // handle uploads
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => `uploads/shoppingPosts/${file.filename}`);
    }

    const post = await ShoppingPost.create({
      title,
      description,
      price,
      category,
      images,
      createdBy: req.user.id,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, post, "Shopping Post created successfully"));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiError(500, "Failed to create post", [error.message]));
  }
};

controller.listPosts = async (req, res) => {
  try {
    const posts = await ShoppingPost.find()
      .populate("category", "name")
      .populate("createdBy", "first_name last_name profilePic")
      .populate("comments.user", "first_name last_name profilePic")
      .sort({ createdAt: -1 });

    const data = posts.map((p) => ({
      _id: p._id,
      title: p.title,
      description: p.description,
      price: p.price,
      images: p.images,
      category: p.category?.name,
      createdBy: {
        name: `${p.createdBy?.first_name || ""} ${p.createdBy?.last_name || ""}`.trim(),
        photo: p.createdBy?.profilePic || null,
      },
      likesCount: p.likes.length,
      comments: p.comments.map((c) => ({
        user: {
          name: `${c.user?.first_name || ""} ${c.user?.last_name || ""}`.trim(),
          photo: c.user?.profilePic || null,
        },
        text: c.text,
        createdAt: c.createdAt,
      })),
      viewsCount: p.views.length,
      createdAt: p.createdAt,
    }));

    return res
      .status(200)
      .json(new ApiResponse(200, data, "Shopping Posts fetched successfully"));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiError(500, "Failed to fetch posts", [error.message]));
  }
};

controller.PostDetail = async (req, res) => {
  try {
    const { postId } = req.params;
    const posts = await ShoppingPost.find({_id: postId})
      .populate("category", "name")
      .populate("createdBy", "first_name last_name profilePic")
      .populate("comments.user", "first_name last_name profilePic")
      .sort({ createdAt: -1 });

    const data = posts.map((p) => ({
      _id: p._id,
      title: p.title,
      description: p.description,
      price: p.price,
      images: p.images,
      category: p.category?.name,
      createdBy: {
        name: `${p.createdBy?.first_name || ""} ${p.createdBy?.last_name || ""}`.trim(),
        photo: p.createdBy?.profilePic || null,
      },
      likesCount: p.likes.length,
      comments: p.comments.map((c) => ({
        user: {
          name: `${c.user?.first_name || ""} ${c.user?.last_name || ""}`.trim(),
          photo: c.user?.profilePic || null,
        },
        text: c.text,
        createdAt: c.createdAt,
      })),
      viewsCount: p.views.length,
      createdAt: p.createdAt,
    }));

    return res
      .status(200)
      .json(new ApiResponse(200, data, "Shopping Posts fetched successfully"));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiError(500, "Failed to fetch posts", [error.message]));
  }
};

controller.likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const post = await ShoppingPost.findById(postId);
    if (!post) return res.status(404).json(new ApiError(404, null, "Post not found"));

    if (post.likes.includes(userId)) {
      post.likes.pull(userId); // Unlike
    } else {
      post.likes.push(userId); // Like
    }
    await post.save();

    return res
      .status(200)
      .json(new ApiResponse(200, { likesCount: post.likes.length }, "Like status updated"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Failed to update like", [error.message]));
  }
};

controller.addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;

    const post = await ShoppingPost.findById(postId);
    if (!post) return res.status(404).json(new ApiError(404, null, "Post not found"));

    post.comments.push({ user: req.user.id, text });
    await post.save();

    return res
      .status(201)
      .json(new ApiResponse(201, post.comments, "Comment added successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Failed to add comment", [error.message]));
  }
};

controller.addView = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const post = await ShoppingPost.findById(postId);
    if (!post) return res.status(404).json(new ApiError(404, null, "Post not found"));

    if (!post.views.includes(userId)) {
      post.views.push(userId);
      await post.save();
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { viewsCount: post.views.length }, "View added successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Failed to add view", [error.message]));
  }
};

controller.updatePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await ShoppingPost.findOne({ _id: postId, deletedAt: null });
    if (!post) {
      return res.status(404).json(new ApiError(404, null, "Post not found"));
    }

    if (post.createdBy.toString() !== req.user.id.toString()) {
      return res.status(403).json(new ApiError(403, null, "Not authorized"));
    }

    const { title, description, price, category } = req.body;

    // handle uploads
    let images = post.images; // keep existing
    if (req.files && req.files.length > 0) {
      images = [...images, ...req.files.map((file) => `uploads/shoppingPosts/${file.filename}`)];
    }

    post.title = title || post.title;
    post.description = description || post.description;
    post.price = price || post.price;
    post.category = category || post.category;
    post.images = images;

    await post.save();

    return res
      .status(200)
      .json(new ApiResponse(200, post, "Shopping Post updated successfully"));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiError(500, "Failed to update post", [error.message]));
  }
};

// Soft Delete Post
controller.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await ShoppingPost.findOne({
      _id: postId,
      deletedAt: null,
    });

    if (!post) {
      return res.status(404).json(new ApiError(404, null, "Post not found"));
    }

    // Only creator can delete
    if (post.createdBy.toString() !== req.user.id.toString()) {
      return res.status(403).json(new ApiError(403, null, "Not authorized"));
    }

    post.deletedAt = new Date();
    await post.save();

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Shopping Post deleted successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Failed to delete post", [error.message]));
  }
};

module.exports = controller;
