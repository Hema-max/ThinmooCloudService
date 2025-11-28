const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'https://api-cloud.thinmoo.com';
const ACCESS_TOKEN = "1000000433937814"; // or from .env
const COMMUNITY_ID = 57104;
const COMMUNITY_UUID = "01000";



// Add Employee
router.post("/add", async (req, res) => {
  try {
    const {
      name, cardNo,uuid, empNo, job, dept, gender, phone, extCommunityId, extCommunityUuid
    } = req.body;

    if (!extCommunityId && !extCommunityUuid) {
      return res.status(400).json({ code: -1, msg: "extCommunityId or extCommunityUuid must be provided" });
    }

    const payload = {
      accessToken: req.body.accessToken, // get from frontend
      extCommunityId,
      extCommunityUuid,
      name,
      job,
      deptId: dept,
      phone,
      cardNos: cardNo,
      uuid,
      empNo,
      gender: gender,
      certType: 0,
      certNo: "",
      disableDevice: 0,
    };

    const response = await axios.post(
      "https://api-cloud.thinmoo.com/wyEmpProperty/extapi/add",
      new URLSearchParams(payload)
    );

    res.json(response.data);
  } catch (err) {
    console.error("Error adding employee:", err.response?.data || err.message);
    res.status(500).json({ code: -1, msg: err.response?.data?.msg || err.message });
  }
});



// 🔹 Update Employee
router.post("/update", async (req, res) => {
  try {
    const { id, name, cardNo,uuid, empNo, job, dept, gender, phone, extCommunityId, extCommunityUuid } = req.body;
    const payload = {
      accessToken: req.body.accessToken, // get from frontend
      extCommunityId,
      extCommunityUuid,
      id,
      name,
      job,
      deptId: dept,
      phone,
      cardNos: cardNo,
      empNo,
      uuid,
      gender: gender,
      certType: 0,
      certNo: "",
      disableDevice: 0,
    };

    const response = await axios.post(
      `${BASE_URL}/wyEmpProperty/extapi/update`,
      new URLSearchParams(payload)
    );
    res.json(response.data);
  } catch (err) {
    console.error("Error updating employee:", err.message);
    res.status(500).json({ code: -1, msg: err.message });
  }
});



// 🔹 Delete Employee
router.delete("/:id", async (req, res) => {
  try {
    const accessToken = req.query.accessToken || req.headers.authorization?.replace("Bearer ", "");
    if (!accessToken) return res.status(400).json({ code: -1, msg: "Missing accessToken" });

    const payload = {
      accessToken: accessToken,
      extCommunityId: req.query.extCommunityId,
      ids: req.params.id,
    };
    const response = await axios.post(
      `${BASE_URL}/wyEmpProperty/extapi/delete`,
      new URLSearchParams(payload)
    );
    res.json(response.data);
  } catch (err) {
    console.error("Error deleting employee:", err.message);
    res.status(500).json({ code: -1, msg: err.message });
  }
});


router.get('/', async (req, res) => {
  try {
    const {
      accessToken,
      extCommunityId,
      extCommunityUuid,
      name,
      empNo,
      cardNo,
      dept,
      currPage = 1,
      pageSize = 10,
    } = req.query;

    if (!accessToken) {
      return res.status(400).json({ code: 400, msg: 'accessToken is required' });
    }

    // ✅ If there is any search filter, fetch everything to apply manual search
    const isSearchActive = name || empNo || cardNo || dept;

    const params = {
      accessToken,
      extCommunityId,
      extCommunityUuid,
      currPage: isSearchActive ? 1 : currPage, // use normal pagination only when no search
      pageSize: isSearchActive ? 2000 : pageSize, // fetch large batch for search
    };

    const response = await axios.get(`${BASE_URL}/wyEmpProperty/extapi/list`, { params });

    if (response.data.code === 0 && response.data.data?.list) {
      let list = response.data.data.list;
      const upstreamTotal = response.data.data.totalCount;

      // ✅ Apply filters manually (case-insensitive)
      if (name) list = list.filter(emp => emp.name?.toLowerCase().includes(name.toLowerCase()));
      if (empNo) {
        list = list.filter(
          emp =>
            emp.empNo?.toLowerCase().includes(empNo.toLowerCase()) ||
            emp.uuid?.toLowerCase().includes(empNo.toLowerCase())
        );
      }
      if (cardNo) list = list.filter(emp => emp.cardNo?.toLowerCase().includes(cardNo.toLowerCase()));
      if (dept) list = list.filter(emp => String(emp.deptId || emp.dept)?.includes(String(dept)));

      // ✅ Manual pagination (only for search case)
      let totalCount = list.length;
      let paginatedList = list;

      if (isSearchActive) {
        const page = Number(currPage);
        const size = Number(pageSize);
        const start = (page - 1) * size;
        const end = start + size;
        paginatedList = list.slice(start, end);
      } else {
        totalCount = upstreamTotal ?? list.length;
      }



      // ✅ Final Response
      res.json({
        code: 0,
        msg: 'success',
        data: {
          totalCount,
          currPage: Number(currPage),
          pageSize: Number(pageSize),
          list: paginatedList,
        },
      });
    } else {
      res.json(response.data);
    }
  } catch (err) {
    console.error('Employee list error:', err.message);
    res.status(500).json({
      code: 500,
      msg: 'Error fetching employees',
      error: err.message,
    });
  }
});







// router.get('/', async (req, res) => {
//   try {
//     const {
//       accessToken,
//       extCommunityId,
//       extCommunityUuid,
//       name,
//       empNo,
//       cardNo,
//       dept,
//       currPage = 1,
//       pageSize = 10
//     } = req.query;

//     if (!accessToken) {
//       return res.status(400).json({ code: 400, msg: 'accessToken is required' });
//     }

//     const params = {
//       accessToken,
//       extCommunityId,
//       extCommunityUuid,
//       currPage,
//       pageSize
//     };

//     const response = await axios.get(`${BASE_URL}/wyEmpProperty/extapi/list`, { params });

//     if (response.data.code === 0 && response.data.data?.list) {
//       let list = response.data.data.list;

//       // ✅ Apply filters manually here
//       if (name) {
//         list = list.filter(emp =>
//           emp.name?.toLowerCase().includes(name.toLowerCase())
//         );
//       }
//       if (empNo) {
//         list = list.filter(emp =>
//           emp.empNo?.toLowerCase().includes(empNo.toLowerCase())
//         );
//       }
//       if (cardNo) {
//         list = list.filter(emp =>
//           emp.cardNo?.toLowerCase().includes(cardNo.toLowerCase())
//         );
//       }
//       if (dept) {
//         list = list.filter(emp =>
//           String(emp.deptId || emp.dept)?.includes(String(dept))
//         );
//       }

//       res.json({
//         code: 0,
//         msg: 'success',
//         data: {
//           totalCount: list.length,
//           currPage: Number(currPage),
//           pageSize: Number(pageSize),
//           list
//         }
//       });
//     } else {
//       res.json(response.data);
//     }
//   } catch (err) {
//     console.error('Employee list error:', err.message);
//     res.status(500).json({ code: 500, msg: 'Error fetching employees', error: err.message });
//   }
// });

// 🔹 Get Employee by ID (correct endpoint)
router.get("/:id", async (req, res) => {
  try {
    const accessToken = req.query.accessToken || req.headers.authorization?.replace("Bearer ", "");
    if (!accessToken) return res.status(400).json({ code: -1, msg: "Missing accessToken" });

    const payload = {
      accessToken: accessToken,
      extCommunityUuid: req.query.extCommunityUuid,
      extCommunityId: req.query.extCommunityId,
      id: req.params.id, // can also support uuid if needed
    };

    const response = await axios.post(
      `${BASE_URL}/wyEmpProperty/extapi/get`,
      new URLSearchParams(payload)
    );

    res.json(response.data);
    console.log(response.data);
  } catch (err) {
    console.error("Error fetching employee details:", err.message);
    res.status(500).json({ code: -1, msg: err.message });
  }
});


module.exports = router;
