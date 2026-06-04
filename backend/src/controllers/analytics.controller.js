import userAnalyticsModel from "../models/userAnalytics.model.js"


const userAnalyticsController = async (req, res, next) => {
    try {
        const { userId } = req.params

        const userData = await userAnalyticsModel.findOne({ userId })

        if (!userData) {
            return res.status(404).json({
                success: false,
                data: null,
                error: "User Analytics data not found" 
            })
        }

        res.status(200).json({
            success: true,
            data: { message: "User analytics data fetched successfully", userData },
            error: null
        })

    } catch (err) {
        next(err)
    }
}

export { userAnalyticsController }