const mongoose = require("mongoose");
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');


const actionSchema = new mongoose.Schema({
  create: { type: Boolean, default: false },
  list: { type: Boolean, default: false },
  "in-list": { type: Boolean, default: false },
  "d-list": { type: Boolean, default: false },
  view: { type: Boolean, default: false },
  update: { type: Boolean, default: false },
  delete: { type: Boolean, default: false },
  statusChange: { type: Boolean, default: false },
  pdf: { type: Boolean, default: false },
  excel: { type: Boolean, default: false },
  csv: { type: Boolean, default: false },
  search: { type: Boolean, default: false },
  log: { type: Boolean, default: false },
});

const submoduleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  actions: {
    type:actionSchema,
    default: {}
  }
});

const permissionSchema = new mongoose.Schema({
  module: { type: String, required: true },
  submodules: [submoduleSchema],
});

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  permissions: [permissionSchema],
  routes: [String],
},{
  timestamps:true
});

roleSchema.plugin(softDeletePlugin);

module.exports = new mongoose.model("Role", roleSchema);