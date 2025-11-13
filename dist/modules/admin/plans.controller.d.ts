import { Request, Response } from 'express';
export declare class PlansController {
    /**
     * Validation rules for creating a plan
     */
    static createPlanValidation: import("express-validator").ValidationChain[];
    /**
     * Validation rules for updating a plan
     */
    static updatePlanValidation: import("express-validator").ValidationChain[];
    /**
     * Get all plans
     */
    static getAllPlans(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Get plan by ID
     */
    static getPlanById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Create a new plan
     */
    static createPlan(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Update a plan
     */
    static updatePlan(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Delete a plan
     */
    static deletePlan(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Assign plan to user
     */
    static assignPlanToUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=plans.controller.d.ts.map