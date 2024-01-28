describe("NetCard Component", ()=>{
    describe('Logical function', ()=>{
        it('should return null when tpNum is less than 0', () => {
            // Arrange
            const tpNum = -1;
        
            // Act
            const result = matchTPlayer(tpNum);
        
            // Assert
            expect(result).toBeNull();
          });

          it('should return null when tpNum is greater than 4', () => {
            // Arrange
            const tpNum = 5;
        
            // Act
            const result = matchTPlayer(tpNum);
        
            // Assert
            expect(result).toBeNull();
          });

              // Returns null when net or net._id is null.
    it('should return null when net is null', () => {
        // Arrange
        const tpNum = 1;
        const net = null;
    
        // Act
        const result = matchTPlayer(tpNum);
    
        // Assert
        expect(result).toBeNull();
      });

      it('should return null when net._id is null', () => {
        // Arrange
        const tpNum = 1;
        const net = { _id: null };
    
        // Act
        const result = matchTPlayer(tpNum);
    
        // Assert
        expect(result).toBeNull();
      });

      it('should return expected player when tpNum is 1 and expectedPlayer is found in teamAPlayers', () => {
        // Arrange
        const tpNum = 1;
        const net = { _id: 'netId' };
        const netPlayers = [{ netId: 'netId' }];
        const teamAPlayers = [{ _id: 'playerAId' }];
    
        // Act
        const result = matchTPlayer(tpNum);
    
        // Assert
        expect(result).toEqual(teamAPlayers[0]);
      });

      it('should return null when precizedNetPlayer is not found', () => {
        // Arrange
        const tpNum = 1;
        const net = { _id: 'netId' };
        const netPlayers = [];
    
        // Act
        const result = matchTPlayer(tpNum);
    
        // Assert
        expect(result).toBeNull();
      });

      it('should return null when expectedPlayer is undefined', () => {
        // Arrange
        const tpNum = 1;
        const net = { _id: 'netId' };
        const netPlayers = [{ netId: 'netId' }];
        const teamAPlayers = [];
    
        // Act
        const result = matchTPlayer(tpNum);
    
        // Assert
        expect(result).toBeNull();
      });

      it('should return expected player when tpNum is 2 and expectedPlayer is found in teamAPlayers', () => {
        // Arrange
        const tpNum = 2;
        const net = { _id: 'netId' };
        const netPlayers = [{ netId: 'netId' }];
        const teamAPlayers = [{ _id: 'playerAId' }];
    
        // Act
        const result = matchTPlayer(tpNum);
    
        // Assert
        expect(result).toEqual(teamAPlayers[0]);
      });






    });



});