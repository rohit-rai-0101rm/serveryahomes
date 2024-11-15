import { TryCatch } from "../middlewares/error.js";
import { NewBlogPostRequestBody } from "../types/types.js";
import { Request, Response, NextFunction } from 'express';
import ErrorHandler from "../utils/utility-class.js";
import { NewsPost, INewsPost } from "../models/news.js";
import sanitizeHtml from 'sanitize-html';  // To sanitize HTML input
import * as cloudinary from "cloudinary";
import { NewsApiFeatures } from "../utils/features.js";
export const newNewsPost = TryCatch(
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
        const existingBlogPost = await NewsPost.findOne({ title });
        if (existingBlogPost) {
            return next(new ErrorHandler("A News post with this title already exists", 400));
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
                folder: "news",
            });

            imagesLinks.push({
                public_id: result.public_id,
                url: result.secure_url,
            });


        }
        const blogPost = await NewsPost.create({
            title,
            content: sanitizedContent,  // Save sanitized content
            author,
            images: imagesLinks,
            publishedAt: new Date()   // Default is null if not provided
        });

        // Prepare response object
        const responseBlogPost: INewsPost = {
            ...blogPost.toJSON(),
        };

        return res.status(201).json({
            success: true,
            message: `News post '${blogPost.title}' created successfully`,
            blogPost: responseBlogPost,
        });
    }
);




export const getAllNews = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
    const resultPerPage = 20;
    const apiFeatures = new NewsApiFeatures(NewsPost.find(), req.query)
        .search()
        .filter()
        .sortByLatest()
        .pagination(resultPerPage);

    const newsPosts = await apiFeatures.query.exec();

    if (!newsPosts || newsPosts.length === 0) {
        return next(new ErrorHandler('No news found', 404));
    }

    res.status(200).json({
        success: true,
        count: newsPosts.length,
        newsPosts,
        resultPerPage
    });
});



export const getNewsByTitle = TryCatch(async (req: Request, res: Response, next: NextFunction) => {
    const { title } = req.params;

    if (!title) {
        return next(new ErrorHandler("Please provide a title to search for", 400));
    }

    // Find the news post by title (case-insensitive)
    const newsPost = await NewsPost.findOne({ title });

    if (!newsPost) {
        return next(new ErrorHandler(`No news post found with the title "${title}"`, 404));
    }

    res.status(200).json({
        success: true,
        newsPost,
    });
});