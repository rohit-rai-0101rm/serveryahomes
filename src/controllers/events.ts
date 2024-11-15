import { TryCatch } from "../middlewares/error.js";
import { NewBlogPostRequestBody } from "../types/types.js";
import { Request, Response, NextFunction } from 'express';
import ErrorHandler from "../utils/utility-class.js";

import sanitizeHtml from 'sanitize-html';  // To sanitize HTML input
import * as cloudinary from "cloudinary";
import { EventPost, IEventPost } from "../models/events.js";
import { EventApiFeatures } from "../utils/features.js";
export const newEventPost = TryCatch(
    async (req: Request<{}, {}, NewBlogPostRequestBody>, res: Response, next: NextFunction) => {

        let imagesFromRequest: any[] = [];
        const { title, content, author, images } = req.body;

        // Validate required fields
        if (!title || !content || !author || !author.name || !author.email) {
            return next(new ErrorHandler("Please fill in all required fields", 400));
        }

        // Sanitize HTML content to prevent XSS or malicious scripts
        const sanitizedContent = sanitizeHtml(content, {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'iframe', 'video']),
            allowedAttributes: {
                ...sanitizeHtml.defaults.allowedAttributes,
                '*': ['style', 'class', 'id']  // Allow custom styles if needed
            }
        });

        // Check if the blog title already exists (unique constraint)
        const existingEventPost = await EventPost.findOne({ title });
        if (existingEventPost) {
            return next(new ErrorHandler("A event post with this title already exists", 400));
        }

        // Check if the author email is unique

        // Create new blog post
        if (typeof req.body.images === "string") {
            imagesFromRequest.push(req.body.images);
        } else {
            imagesFromRequest = req.body.images;
        }

        const imagesLinks = [];
        for (let i = 0; i < images.length; i++) {
            const result = await cloudinary.v2.uploader.upload(imagesFromRequest[i], {
                folder: "events",
            });

            imagesLinks.push({
                public_id: result.public_id,
                url: result.secure_url,
            });

            // console.log("imageLinks", imagesLinks)
        }
        const eventPost = await EventPost.create({
            title,
            content: sanitizedContent,  // Save sanitized content
            author,
            images: imagesLinks,
            // Default is null if not provided
        });

        // Prepare response object
        const responseEventPost: IEventPost = {
            ...eventPost.toJSON(),
        };

        return res.status(201).json({
            success: true,
            message: `Event post '${eventPost.title}' created successfully`,
            blogPost: responseEventPost,
        });
    }
);






export const getAllEvents = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
    const resultPerPage = 20;
    const apiFeatures = new EventApiFeatures(EventPost.find(), req.query)
        .search()
        .filter()
        .sortByLatest()
        .pagination(resultPerPage);

    const eventposts = await apiFeatures.query.exec();

    if (!eventposts || eventposts.length === 0) {
        return next(new ErrorHandler('No events found', 404));
    }

    res.status(200).json({
        success: true,
        count: eventposts.length,
        eventposts,
        resultPerPage
    });
});






export const getEventDetails = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
    const title = req.params.title;

    // Find property by title
    const event = await EventPost.findOne({ title });

    if (!event) {
        return next(new ErrorHandler("Event not found", 404));
    }

    // Populate 'listedBy' field with 'name', 'email', and 'role'


    // Respond with property details
    return res.status(200).json({
        success: true,
        event,
    });
});