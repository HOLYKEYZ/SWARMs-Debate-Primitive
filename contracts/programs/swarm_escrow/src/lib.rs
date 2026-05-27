use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("SwarmEscrow11111111111111111111111111111111111");

#[program]
pub mod swarm_escrow {
    use super::*;

    pub fn initialize_escrow(
        ctx: Context<InitializeEscrow>,
        amount: u64,
        question_hash: String,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_state;
        
        escrow.requester = ctx.accounts.requester.key();
        escrow.oracle = ctx.accounts.oracle.key();
        escrow.amount = amount;
        escrow.question_hash = question_hash;
        escrow.is_resolved = false;
        escrow.quorum_reached = false;
        escrow.bump = ctx.bumps.escrow_state;

        // transfer SOL from requester to PDA
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.requester.to_account_info(),
                to: escrow.to_account_info(),
            },
        );
        system_program::transfer(cpi_context, amount)?;

        Ok(())
    }

    pub fn resolve_escrow(
        ctx: Context<ResolveEscrow>,
        transcript_hash: String,
        quorum_reached: bool,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_state;

        require!(!escrow.is_resolved, ErrorCode::AlreadyResolved);

        escrow.is_resolved = true;
        escrow.quorum_reached = quorum_reached;
        escrow.transcript_hash = transcript_hash;

        // If quorum reached, release funds (in this demo, we release back to requester)
        // In a real product, it might go to a different recipient
        if quorum_reached {
            let amount = escrow.amount;
            **escrow.to_account_info().try_borrow_mut_lamports()? -= amount;
            **ctx.accounts.requester.try_borrow_mut_lamports()? += amount;
        }

        Ok(())
    }

    pub fn refund_escrow(ctx: Context<RefundEscrow>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_state;
        
        require!(!escrow.is_resolved, ErrorCode::AlreadyResolved);

        // Allow requester to reclaim funds unconditionally after timeout 
        // (For hackathon, we skip the slot timestamp check and allow manual refund)
        let amount = **escrow.to_account_info().lamports.borrow();
        **escrow.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.requester.try_borrow_mut_lamports()? += amount;
        
        // Account closed via the macro
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(amount: u64, question_hash: String)]
pub struct InitializeEscrow<'info> {
    #[account(
        init,
        payer = requester,
        space = 8 + 32 + 32 + 8 + 64 + 64 + 1 + 1 + 1, // Discriminator + pubkeys + amount + hashes + bools + bump
        seeds = [b"escrow", requester.key().as_ref(), question_hash.as_bytes()],
        bump
    )]
    pub escrow_state: Account<'info, EscrowState>,
    
    #[account(mut)]
    pub requester: Signer<'info>,
    
    /// CHECK: The oracle backend pubkey that will sign the resolution
    pub oracle: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveEscrow<'info> {
    #[account(
        mut,
        has_one = requester,
        has_one = oracle @ ErrorCode::UnauthorizedOracle,
        close = requester
    )]
    pub escrow_state: Account<'info, EscrowState>,
    
    pub oracle: Signer<'info>,
    
    /// CHECK: Recipient of the funds
    #[account(mut)]
    pub requester: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct RefundEscrow<'info> {
    #[account(
        mut,
        has_one = requester,
        close = requester // Refund and close the account
    )]
    pub escrow_state: Account<'info, EscrowState>,
    
    #[account(mut)]
    pub requester: Signer<'info>,
}

#[account]
pub struct EscrowState {
    pub requester: Pubkey,
    pub oracle: Pubkey,
    pub amount: u64,
    pub question_hash: String,
    pub transcript_hash: String,
    pub is_resolved: bool,
    pub quorum_reached: bool,
    pub bump: u8,
}

#[error_code]
pub enum ErrorCode {
    #[msg("The escrow has already been resolved.")]
    AlreadyResolved,
    #[msg("You are not the authorized oracle for this escrow.")]
    UnauthorizedOracle,
}
