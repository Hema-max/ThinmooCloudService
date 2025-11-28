const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'https://api-cloud.thinmoo.com';

router.get('/', async (req, res) => {
    try {
        const { accessToken, extCommunityId } = req.query;

        if (!accessToken || !extCommunityId) {
            return res.status(400).json({ code: 400, msg: 'accessToken and extCommunityId are required' });
        }

        let allDepartments = [];
        let currPage = 1;
        const pageSize = 50;
        let totalPage = 1;

        do {
            const response = await axios.get(`${BASE_URL}/wyDept/extapi/list`, {
                params: { accessToken, extCommunityId, currPage, pageSize }
            });

            if (response.data.code !== 0 || !response.data.data?.list) break;

            allDepartments = allDepartments.concat(response.data.data.list);
            totalPage = response.data.data.totalPage;
            currPage++;

        } while (currPage <= totalPage);

        const dropdownList = allDepartments.map(dep => ({
            id: dep.id,
            name: dep.name,
            parentId: dep.parentId
        }));

        res.json({ code: 0, msg: 'success', data: dropdownList });

    } catch (err) {
        console.error('Department list error:', err.message);
        res.status(500).json({ code: 500, msg: 'Error fetching departments', error: err.message });
    }
});

module.exports = router;
