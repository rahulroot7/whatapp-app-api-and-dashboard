const controller = {}
const {  User } = require("../../models");
const { Op } = require('sequelize');
const ApiError = require('../../utils/ApiError')
const ApiResponse = require('../../utils/ApiResponse')
const { query, validationResult } = require('express-validator');

controller.userDashboard = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const [users, profile] = await Promise.all([
            User.findAll({ where: { status: '1' } }),         
            User.findOne({ where: { status: '1', id: currentUserId } })
        ]);
        console.log(req.user.id);
    
        const data = {
          users: users,
          profile: profile,
        };  
        res.json(new ApiResponse(200, data, "Dashboard fetched successfully"));
    } catch (error) {
        res.status(500).json(new ApiError(500, "Internal Server Error", [error.message]));
    }
}

module.exports = controller