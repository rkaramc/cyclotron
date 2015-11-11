/*
 * Copyright (c) 2013-2015 the original author or authors.
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with the License. 
 * You may obtain a copy of the License at
 *
 *     http://www.opensource.org/licenses/mit-license.php
 *
 * Unless required by applicable law or agreed to in writing, 
 * software distributed under the License is distributed on an 
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, 
 * either express or implied. See the License for the specific 
 * language governing permissions and limitations under the License. 
 */ 
 
/* 
 * API for Dashboard Revisions
 */

var _ = require("lodash"),
    mongoose = require('mongoose'),
    api = require('./api'),
    auth = require('./auth');
    
var Dashboards = mongoose.model('dashboard2'),
    Revisions = mongoose.model('revision');

/* Get all revisions for a dashboard */
exports.get = function (req, res) {
    var name = req.params.name.toLowerCase();

    Revisions
        .find({ name: name})
        .select('-dashboard')
        .sort('-rev')
        .exec(_.wrap(res, api.getCallback));
};

/* Get a specific revision for a dashboard */
exports.getSingle = function (req, res) {
    var name = req.params.name.toLowerCase();
    var rev = req.params.rev;

    Dashboards
        .findOne({ name: name })
        .select('-dashboard')
        .exec(function(err, dashboard) {
            if (err) {
                console.log(err);
                return res.status(500).send(err);
            } else if (_.isUndefined(dashboard) || _.isNull(dashboard)) {
                return res.status(404).send('Dashboard not found.');
            }

            if (!_.isEmpty(dashboard.viewers)) {
                if (auth.isUnauthenticated(req)) {
                    return res.status(401).send('Authentication required: this dashboard has restricted permissions.');
                }

                /* Check view permissions */
                if (!auth.hasViewPermission(dashboard, req)) {
                    return res.status(403).send('View Permission denied for this Dashboard.');
                }
            }

            /* View permissions allowed */
            Revisions
                .findOne({ name: name, rev: rev})
                .populate('createdBy lastUpdatedBy', 'sAMAccountName name email')
                .exec(_.wrap(res, api.getCallback));
        });

    
};
