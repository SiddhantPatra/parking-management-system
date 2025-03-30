import { Button, Card, Dialog, DialogBody, DialogFooter, DialogHeader, Rating, Typography } from '@material-tailwind/react';
import React from 'react'

const ReviewsDialog = ({ 
    open, 
    handleClose, 
    reviewsData 
}) => (
    <Dialog open={open} handler={handleClose} size="lg">
        <DialogHeader>Parking Slot Reviews</DialogHeader>
        <DialogBody className="max-h-[60vh] overflow-y-auto">
            <div className="mb-6 text-center">
                <Typography variant="h4" className="mb-2">
                    Average Rating
                </Typography>
                <Rating 
                    value={Math.round(reviewsData.averageRating)} 
                    readonly 
                    ratedColor="amber" 
                />
                <Typography variant="paragraph" className="mt-2">
                    {reviewsData.averageRating.toFixed(1)} stars ({reviewsData.reviewCount} reviews)
                </Typography>
            </div>

            <div className="space-y-6 overflow-none">
                {reviewsData.reviews.length > 0 ? (
                    reviewsData.reviews.map((review, index) => (
                        <Card key={index} className="p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <Typography variant="h6">
                                        {review.user?.name || 'Anonymous'}
                                    </Typography>
                                    <Typography variant="small" color="gray">
                                        {new Date(review.reviewedAt).toLocaleDateString()}
                                    </Typography>
                                </div>
                                <Rating 
                                    value={review.rating} 
                                    readonly 
                                    ratedColor="amber" 
                                    size="sm" 
                                />
                            </div>
                            <Typography className="mt-2">
                                Vehicle: {review.vehicleNumber}
                            </Typography>
                            <Typography className="mt-2">
                                {review.comment}
                            </Typography>
                        </Card>
                    ))
                ) : (
                    <Typography className="text-center py-4">
                        No reviews yet for this parking slot
                    </Typography>
                )}
            </div>
        </DialogBody>
        <DialogFooter>
            <Button variant="text" color="red" onClick={handleClose}>
                Close
            </Button>
        </DialogFooter>
    </Dialog>
);

export default ReviewsDialog