/* eslint-disable ui-testing/no-disabled-tests */
describe('Tests for creating proposals', () => {
  let startTime;
  context('Setting up accounts', () => {
    it('should set up wallets for two members of the econ committee.', () => {
      cy.setupWallet({
        secretWords:
          'such field health riot cost kitten silly tube flash wrap festival portion imitate this make question host bitter puppy wait area glide soldier knee',
        walletName: 'gov2',
      });
      cy.setupWallet({
        secretWords:
          'physical immune cargo feel crawl style fox require inhale law local glory cheese bring swear royal spy buyer diesel field when task spin alley',
        walletName: 'gov1',
      });
    });

    it('should connect with chain and wallet', () => {
      cy.visit('/?agoricNet=local');
      cy.acceptAccess();
    });
  });

  context('Adjusting Vault Params', () => {
    it('should allow gov1 to create a proposal', () => {
      cy.visit('/?agoricNet=local');
      cy.acceptAccess();

      cy.get('button').contains('Vaults').click();
      cy.get('button').contains('Select Manager').click();
      cy.get('button').contains('manager0').click();

      cy.get('label')
        .contains('LiquidationMargin')
        .parent()
        .within(() => {
          cy.get('input').clear().type('150');
        });

      cy.get('label')
        .contains('LiquidationPadding')
        .parent()
        .within(() => {
          cy.get('input').clear().type('25');
        });

      cy.get('label')
        .contains('LiquidationPenalty')
        .parent()
        .within(() => {
          cy.get('input').clear().type('1');
        });

      cy.get('label')
        .contains('StabilityFee')
        .parent()
        .within(() => {
          cy.get('input').clear().type('1');
        });

      cy.get('label')
        .contains('MintFee')
        .parent()
        .within(() => {
          cy.get('input').clear().type('0.5');
        });

      cy.get('label')
        .contains('Minutes until close of vote')
        .parent()
        .within(() => {
          cy.get('input').clear().type(1);
        });
      cy.get('[value="Propose Parameter Change"]').click();

      cy.confirmTransaction();
      cy.get('p')
        .contains('sent')
        .should('be.visible')
        .then(() => {
          startTime = Date.now();
        });
    });

    it('should allow gov1 to vote on the proposal', () => {
      cy.visit('/?agoricNet=local');

      cy.get('button').contains('Vote').click();
      cy.get('p').contains('YES').click();
      cy.get('input:enabled[value="Submit Vote"]').click();

      cy.confirmTransaction();
      cy.get('p').contains('sent').should('be.visible');
    });

    it('should allow gov2 to vote on the proposal', () => {
      cy.switchWallet('gov2');
      cy.visit('/?agoricNet=local');

      cy.get('button').contains('Vote').click();
      cy.get('p').contains('YES').click();
      cy.get('input:enabled[value="Submit Vote"]').click();

      cy.confirmTransaction();
      cy.get('p').contains('sent').should('be.visible');
    });

    it('should wait for proposal to pass', () => {
      cy.wait(60000 - Date.now() + startTime);
      cy.visit('/?agoricNet=local');

      cy.get('button').contains('History').click();

      cy.get('code')
        .contains('VaultFactory - ATOM')
        .parent()
        .parent()
        .parent()
        .within(() => {
          cy.get('span').contains('Change Accepted').should('be.visible');
        });
    });
  });

  context('Adjusting Auction Params', () => {
    it('should allow gov2 to create a proposal', () => {
      cy.visit('/?agoricNet=local');

      cy.get('button').contains('Vaults').click();
      cy.get('button').contains('Change Manager Params').click();
      cy.get('button').contains('Change Auctioneer Params').click();

      cy.get('label')
        .contains('StartingRate')
        .parent()
        .within(() => {
          cy.get('input').clear().type('105');
        });

      cy.get('label')
        .contains('LowestRate')
        .parent()
        .within(() => {
          cy.get('input').clear().type('65');
        });

      cy.get('label')
        .contains('DiscountStep')
        .parent()
        .within(() => {
          cy.get('input').clear().type('5');
        });

      cy.get('label')
        .contains('AuctionStartDelay')
        .parent()
        .within(() => {
          cy.get('input').clear().type('2');
        });

      cy.get('label')
        .contains('Minutes until close of vote')
        .parent()
        .within(() => {
          cy.get('input').clear().type(1);
        });
      cy.get('[value="Propose Parameter Change"]').click();

      cy.confirmTransaction();
      cy.get('p')
        .contains('sent')
        .should('be.visible')
        .then(() => {
          startTime = Date.now();
        });
    });

    it('should allow gov2 to vote on the proposal', () => {
      cy.visit('/?agoricNet=local');

      cy.get('button').contains('Vote').click();
      cy.get('p').contains('YES').click();
      cy.get('input:enabled[value="Submit Vote"]').click();

      cy.confirmTransaction();
      cy.get('p').contains('sent').should('be.visible');
    });

    it('should allow gov1 to vote on the proposal', () => {
      cy.switchWallet('gov1');
      cy.visit('/?agoricNet=local');

      cy.get('button').contains('Vote').click();
      cy.get('p').contains('YES').click();
      cy.get('input:enabled[value="Submit Vote"]').click();

      cy.confirmTransaction();
      cy.get('p').contains('sent').should('be.visible');
    });

    it('should wait for proposal to pass', () => {
      cy.wait(60000 - Date.now() + startTime);
      cy.visit('/?agoricNet=local');

      cy.get('button').contains('History').click();

      cy.get('code')
        .contains('VaultFactory - ATOM')
        .parent()
        .parent()
        .parent()
        .within(() => {
          cy.get('span').contains('Change Accepted').should('be.visible');
        });
    });
  });

  context('Creating Vaults', () => {
    it('should setup wallet using 24 word phrase', () => {
      cy.setupWallet({
        secretWords:
          'tackle hen gap lady bike explain erode midnight marriage wide upset culture model select dial trial swim wood step scan intact what card symptom',
        password: 'Test1234',
        newAccount: true,
        walletName: 'My Wallet 2',
      }).then(setupFinished => {
        expect(setupFinished).to.be.true;
      });
    });

    it('should connect with the wallet', () => {
      cy.visit('http://localhost:5174/#/vaults');

      cy.contains('Connect Wallet').click();

      cy.acceptAccess().then(taskCompleted => {
        expect(taskCompleted).to.be.true;
      });

      cy.get('label.cursor-pointer input[type="checkbox"]').check();
      cy.contains('Proceed').click();

      cy.acceptAccess().then(taskCompleted => {
        expect(taskCompleted).to.be.true;
      });
    });

    it('should create a vault with a deposit of 15 ATOMs and debt of 100 ISTs', () => {
      cy.contains('button', /ATOM/).click();

      cy.contains('.input-label', 'ATOM to lock up *')
        .next()
        .within(() => {
          cy.get('input[type="number"]').click();
          cy.get('input[type="number"]').clear();
          cy.get('input[type="number"]').type(15);
        });

      cy.contains('.input-label', 'IST to receive *')
        .next()
        .within(() => {
          cy.get('input[type="number"]').click();
          cy.get('input[type="number"]').clear();
          cy.get('input[type="number"]').type(100);
        });

      cy.contains('button', 'Create Vault').click();

      cy.confirmTransaction().then(taskCompleted => {
        expect(taskCompleted).to.be.true;
        cy.contains(
          'p',
          'You can manage your vaults from the "My Vaults" view.',
        ).should('exist');
      });
    });

    it('should create a vault with a deposit of 15 ATOMs and debt of 103 ISTs', () => {
      cy.contains('button', 'Create Another Vault').click();
      cy.reload();
      cy.contains('span', 'Add new vault').click();
      cy.contains('button', /ATOM/).click();

      cy.contains('.input-label', 'ATOM to lock up *')
        .next()
        .within(() => {
          cy.get('input[type="number"]').click();
          cy.get('input[type="number"]').clear();
          cy.get('input[type="number"]').type(15);
        });

      cy.contains('.input-label', 'IST to receive *')
        .next()
        .within(() => {
          cy.get('input[type="number"]').click();
          cy.get('input[type="number"]').clear();
          cy.get('input[type="number"]').type(100);
        });

      cy.contains('button', 'Create Vault').click();

      cy.confirmTransaction().then(taskCompleted => {
        expect(taskCompleted).to.be.true;
        cy.contains(
          'p',
          'You can manage your vaults from the "My Vaults" view.',
        ).should('exist');
      });
    });

    it('should create a vault with a deposit of 15 ATOMs and debt of 105 ISTs', () => {
      cy.contains('button', 'Create Another Vault').click();
      cy.reload();
      cy.contains('span', 'Add new vault').click();
      cy.contains('button', /ATOM/).click();

      cy.contains('.input-label', 'ATOM to lock up *')
        .next()
        .within(() => {
          cy.get('input[type="number"]').click();
          cy.get('input[type="number"]').clear();
          cy.get('input[type="number"]').type(15);
        });

      cy.contains('.input-label', 'IST to receive *')
        .next()
        .within(() => {
          cy.get('input[type="number"]').click();
          cy.get('input[type="number"]').clear();
          cy.get('input[type="number"]').type(105);
        });

      cy.contains('button', 'Create Vault').click();

      cy.confirmTransaction().then(taskCompleted => {
        expect(taskCompleted).to.be.true;
        cy.contains(
          'p',
          'You can manage your vaults from the "My Vaults" view.',
        ).should('exist');
      });
    });
  });
});
